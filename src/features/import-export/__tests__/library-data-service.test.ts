import type { SQLiteBindParams, SQLiteRunResult } from "expo-sqlite";

import type { DatabaseWriter } from "../../../lib/db";
import { buildLibraryExportManifest } from "../services/library-data-service";

describe("library data service", () => {
  it("builds a schema-versioned manifest from whitelisted local tables", async () => {
    const db = createFakeDatabase();

    const manifest = await buildLibraryExportManifest(db);

    expect(manifest.schemaVersion).toBe(2);
    expect(manifest.tables.books).toEqual([expect.objectContaining({ id: "book-1", title: "Piranesi" })]);
    expect(manifest.tables.bookmarks).toEqual([expect.objectContaining({ book_id: "book-1", page: 42 })]);
    expect(db.selects).toEqual(expect.arrayContaining([expect.stringContaining("FROM books"), expect.stringContaining("FROM bookmarks")]));
  });
});

interface FakeDatabase extends DatabaseWriter {
  selects: string[];
}

function createFakeDatabase(): FakeDatabase {
  const selects: string[] = [];

  return {
    selects,
    async execAsync() {
      return undefined;
    },
    async getAllAsync<T>(source: string): Promise<T[]> {
      selects.push(source);

      if (source.includes("FROM books")) {
        return [
          {
            author: "Susanna Clarke",
            cover_color: "#111111",
            cover_path: null,
            created_at: "2026-05-14T00:00:00.000Z",
            current_page: 42,
            finished_at: null,
            genre: "fantasy",
            id: "book-1",
            isbn: null,
            is_changed_you: 1,
            mood_tag: null,
            source: "fixture",
            spine_color: "#000000",
            started_at: null,
            status: "reading",
            title: "Piranesi",
            total_pages: 248,
            updated_at: "2026-05-14T00:00:00.000Z"
          }
        ] as T[];
      }

      if (source.includes("FROM bookmarks")) {
        return [
          {
            book_id: "book-1",
            created_at: "2026-05-14T00:00:00.000Z",
            id: "bookmark-1",
            label: "Page 42",
            note: null,
            page: 42,
            updated_at: "2026-05-14T00:00:00.000Z"
          }
        ] as T[];
      }

      return [];
    },
    async getFirstAsync() {
      return null;
    },
    async runAsync(_source: string, _params?: SQLiteBindParams): Promise<SQLiteRunResult> {
      return { changes: 1, lastInsertRowId: 1 };
    },
    async withExclusiveTransactionAsync(task) {
      await task(this);
    }
  };
}
