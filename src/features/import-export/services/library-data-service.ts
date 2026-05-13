import { Directory, File, Paths } from "expo-file-system";
import { z } from "zod";

import type { DatabaseReader, DatabaseWriter } from "../../../lib/db";

const exportTableNames = [
  "books",
  "shelves",
  "shelf_books",
  "reading_sessions",
  "quotes",
  "book_notes",
  "bookmarks",
  "app_settings",
  "notifications_log",
  "share_events",
  "open_library_cache"
] as const;

type ExportTableName = (typeof exportTableNames)[number];
type SQLiteValue = string | number | null;
type ExportRow = Record<string, SQLiteValue>;
type ExportTables = Record<ExportTableName, ExportRow[]>;

export interface LibraryExportManifest {
  exportedAt: string;
  schemaVersion: 2;
  tables: ExportTables;
}

export interface LibraryExportResult {
  bookCount: number;
  uri: string;
}

export interface LibraryImportResult {
  bookCount: number;
  restoredRows: number;
}

const sqliteValueSchema = z.union([z.string(), z.number(), z.null()]);
const exportManifestSchema = z.object({
  exportedAt: z.string().min(1),
  schemaVersion: z.literal(2),
  tables: z.record(z.string(), z.array(z.record(z.string(), sqliteValueSchema)))
});

const tableColumns = {
  books: [
    "id",
    "title",
    "author",
    "status",
    "total_pages",
    "current_page",
    "cover_path",
    "cover_color",
    "spine_color",
    "isbn",
    "genre",
    "source",
    "mood_tag",
    "is_changed_you",
    "started_at",
    "finished_at",
    "created_at",
    "updated_at"
  ],
  shelves: ["id", "name", "description", "accent", "kind", "visibility", "sort_order", "created_at", "updated_at"],
  shelf_books: ["shelf_id", "book_id", "sort_order", "pinned_at", "added_at"],
  reading_sessions: [
    "id",
    "book_id",
    "pages_read",
    "started_page",
    "ended_page",
    "duration_minutes",
    "note",
    "read_at",
    "created_at"
  ],
  quotes: ["id", "book_id", "text", "page", "source_image_path", "capture_method", "created_at", "updated_at"],
  book_notes: ["id", "book_id", "title", "body", "page", "created_at", "updated_at"],
  bookmarks: ["id", "book_id", "page", "label", "note", "created_at", "updated_at"],
  app_settings: ["key", "value", "updated_at"],
  notifications_log: [
    "id",
    "type",
    "title",
    "body",
    "scheduled_for",
    "sent_at",
    "tapped_at",
    "is_read",
    "local_notification_id",
    "created_at"
  ],
  share_events: ["id", "card_type", "source_id", "output_path", "used_for_streak", "shared_at"],
  open_library_cache: ["cache_key", "response_json", "fetched_at", "expires_at"]
} satisfies Record<ExportTableName, readonly string[]>;

const conflictColumns = {
  books: ["id"],
  shelves: ["id"],
  shelf_books: ["shelf_id", "book_id"],
  reading_sessions: ["id"],
  quotes: ["id"],
  book_notes: ["id"],
  bookmarks: ["id"],
  app_settings: ["key"],
  notifications_log: ["id"],
  share_events: ["id"],
  open_library_cache: ["cache_key"]
} satisfies Record<ExportTableName, readonly string[]>;

/** Builds a portable JSON snapshot from local SQLite tables. */
export async function buildLibraryExportManifest(db: DatabaseReader): Promise<LibraryExportManifest> {
  const tables = {} as ExportTables;

  for (const table of exportTableNames) {
    const columns = tableColumns[table].join(", ");
    tables[table] = await db.getAllAsync<ExportRow>(`SELECT ${columns} FROM ${table};`);
  }

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 2,
    tables
  };
}

export async function exportLibraryToFileAsync(db: DatabaseReader): Promise<LibraryExportResult> {
  const manifest = await buildLibraryExportManifest(db);
  const exportDirectory = new Directory(Paths.document, "exports");
  exportDirectory.create({ idempotent: true, intermediates: true });

  const filename = `inki-export-${manifest.exportedAt.replace(/[:.]/g, "-")}.json`;
  const file = new File(exportDirectory, filename);
  file.create({ overwrite: true });
  file.write(JSON.stringify(manifest, null, 2));

  return { bookCount: manifest.tables.books.length, uri: file.uri };
}

export async function importLibraryFromFileAsync(
  db: DatabaseWriter,
  uri: string
): Promise<LibraryImportResult> {
  const raw = await new File(uri).text();
  const manifest = parseLibraryExportManifest(JSON.parse(raw));
  let restoredRows = 0;

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const table of exportTableNames) {
      for (const row of manifest.tables[table]) {
        await upsertExportRow(txn, table, row);
        restoredRows += 1;
      }
    }
  });

  return { bookCount: manifest.tables.books.length, restoredRows };
}

function parseLibraryExportManifest(value: unknown): LibraryExportManifest {
  const parsed = exportManifestSchema.parse(value);
  const tables = {} as ExportTables;

  for (const table of exportTableNames) {
    const rows = parsed.tables[table] ?? [];
    tables[table] = rows.map((row) => sanitizeRow(table, row));
  }

  return {
    exportedAt: parsed.exportedAt,
    schemaVersion: parsed.schemaVersion,
    tables
  };
}

function sanitizeRow(table: ExportTableName, row: Record<string, SQLiteValue>): ExportRow {
  const allowedColumns = new Set(tableColumns[table]);
  const sanitized: ExportRow = {};

  for (const [key, value] of Object.entries(row)) {
    if (allowedColumns.has(key)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

async function upsertExportRow(
  db: DatabaseWriter,
  table: ExportTableName,
  row: ExportRow
): Promise<void> {
  const columns = tableColumns[table].filter((column) => Object.prototype.hasOwnProperty.call(row, column));

  if (columns.length === 0) {
    return;
  }

  const conflicts = conflictColumns[table];
  const missingConflict = conflicts.some((column) => !columns.includes(column));

  if (missingConflict) {
    return;
  }

  const placeholders = columns.map(() => "?").join(", ");
  const updateColumns = columns.filter((column) => !conflicts.includes(column));
  const conflictSql = conflicts.join(", ");
  const updateSql = updateColumns.length > 0
    ? `DO UPDATE SET ${updateColumns.map((column) => `${column} = excluded.${column}`).join(", ")}`
    : "DO NOTHING";

  await db.runAsync(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})
     ON CONFLICT(${conflictSql}) ${updateSql};`,
    columns.map((column) => row[column] ?? null)
  );
}
