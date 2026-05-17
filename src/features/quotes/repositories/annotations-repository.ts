import type { DatabaseReader, DatabaseWriter } from "../../../lib/db";
import { createLocalId, nowIso } from "../../../lib/time";
import type {
  Bookmark,
  BookmarkRow,
  BookAnnotations,
  BookNote,
  BookNoteRow,
  CreateBookmarkInput,
  CreateBookNoteInput,
  CreateQuoteInput,
  Quote,
  QuoteRow
} from "../types";
import { mapBookmarkRow, mapBookNoteRow, mapQuoteRow } from "../types";
import {
  parseCreateBookmarkInput,
  parseCreateBookNoteInput,
  parseCreateQuoteInput
} from "../validation";

export interface AnnotationsRepository {
  addBookmark(input: CreateBookmarkInput): Promise<Bookmark>;
  addNote(input: CreateBookNoteInput): Promise<BookNote>;
  addQuote(input: CreateQuoteInput): Promise<Quote>;
  listForBook(bookId: string): Promise<BookAnnotations>;
}

export const createAnnotationsRepository = (db: DatabaseWriter): AnnotationsRepository => ({
  addBookmark: (input) => addBookmark(db, input),
  addNote: (input) => addNote(db, input),
  addQuote: (input) => addQuote(db, input),
  listForBook: (bookId) => listBookAnnotations(db, bookId)
});

export const listBookAnnotations = async (
  db: DatabaseReader,
  bookId: string
): Promise<BookAnnotations> => {
  const [bookmarks, notes, quotes] = await Promise.all([
    listBookmarks(db, bookId),
    listBookNotes(db, bookId),
    listQuotes(db, bookId)
  ]);

  return { bookmarks, notes, quotes };
};

export const listBookmarks = async (db: DatabaseReader, bookId: string): Promise<Bookmark[]> => {
  const rows = await db.getAllAsync<BookmarkRow>(
    `SELECT id, book_id, page, label, note, created_at, updated_at
     FROM bookmarks
     WHERE book_id = ?
     ORDER BY page ASC, created_at DESC;`,
    [bookId]
  );

  return rows.map(mapBookmarkRow);
};

/** Counts saved bookmarks per calendar day across all books, keyed by YYYY-MM-DD. */
export const countBookmarksByDay = async (
  db: DatabaseReader
): Promise<Record<string, number>> => {
  const rows = await db.getAllAsync<{ day: string; total: number }>(
    `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS total
     FROM bookmarks
     GROUP BY day;`
  );

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.day] = row.total;
  }

  return counts;
};

export const listBookNotes = async (db: DatabaseReader, bookId: string): Promise<BookNote[]> => {
  const rows = await db.getAllAsync<BookNoteRow>(
    `SELECT id, book_id, title, body, page, created_at, updated_at
     FROM book_notes
     WHERE book_id = ?
     ORDER BY updated_at DESC, created_at DESC;`,
    [bookId]
  );

  return rows.map(mapBookNoteRow);
};

export const listQuotes = async (db: DatabaseReader, bookId: string): Promise<Quote[]> => {
  const rows = await db.getAllAsync<QuoteRow>(
    `SELECT id, book_id, text, page, source_image_path, capture_method, created_at, updated_at
     FROM quotes
     WHERE book_id = ?
     ORDER BY updated_at DESC, created_at DESC;`,
    [bookId]
  );

  return rows.map(mapQuoteRow);
};

export const addBookmark = async (
  db: DatabaseWriter,
  input: CreateBookmarkInput
): Promise<Bookmark> => {
  const parsed = parseCreateBookmarkInput(input);
  const id = createLocalId("bookmark");
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO bookmarks (id, book_id, page, label, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(book_id, page) DO UPDATE SET
       label = COALESCE(excluded.label, bookmarks.label),
       note = COALESCE(excluded.note, bookmarks.note),
       updated_at = excluded.updated_at;`,
    [id, parsed.bookId, parsed.page, parsed.label ?? null, parsed.note ?? null, now, now]
  );

  return {
    bookId: parsed.bookId,
    createdAt: now,
    id,
    label: parsed.label,
    note: parsed.note,
    page: parsed.page,
    updatedAt: now
  };
};

export const addNote = async (
  db: DatabaseWriter,
  input: CreateBookNoteInput
): Promise<BookNote> => {
  const parsed = parseCreateBookNoteInput(input);
  const id = createLocalId("note");
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO book_notes (id, book_id, title, body, page, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, parsed.bookId, parsed.title ?? null, parsed.body, parsed.page ?? null, now, now]
  );

  return {
    body: parsed.body,
    bookId: parsed.bookId,
    createdAt: now,
    id,
    page: parsed.page,
    title: parsed.title,
    updatedAt: now
  };
};

export const addQuote = async (db: DatabaseWriter, input: CreateQuoteInput): Promise<Quote> => {
  const parsed = parseCreateQuoteInput(input);
  const id = createLocalId("quote");
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO quotes (id, book_id, text, page, source_image_path, capture_method, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      parsed.bookId,
      parsed.text,
      parsed.page ?? null,
      parsed.sourceImagePath ?? null,
      parsed.captureMethod ?? "manual",
      now,
      now
    ]
  );

  return {
    bookId: parsed.bookId,
    captureMethod: parsed.captureMethod ?? "manual",
    createdAt: now,
    id,
    page: parsed.page,
    sourceImagePath: parsed.sourceImagePath,
    text: parsed.text,
    updatedAt: now
  };
};
