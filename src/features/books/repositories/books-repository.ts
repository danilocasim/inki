import type { DatabaseReader, DatabaseWriter } from "../../../lib/db";
import { createLocalId, nowIso } from "../../../lib/time";
import type { Book, BookRow, BookStatus, CreateBookInput, UpdateBookInput } from "../types";
import { mapBookRow } from "../types";

export interface BooksRepository {
  create(input: CreateBookInput): Promise<Book>;
  delete(bookId: string): Promise<void>;
  getById(id: string): Promise<Book | undefined>;
  list(): Promise<Book[]>;
  listByStatus(status: BookStatus): Promise<Book[]>;
  togglePin(bookId: string): Promise<Book>;
  update(bookId: string, input: UpdateBookInput): Promise<Book>;
}

export const createBooksRepository = (db: DatabaseWriter): BooksRepository => ({
  async create(input) {
    const id = createLocalId("book");
    const now = nowIso();

    await db.runAsync(
      `INSERT INTO books (
        id, title, author, status, total_pages, current_page, cover_color, spine_color,
        cover_path, isbn, genre, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.title.trim(),
        input.author.trim(),
        input.status,
        input.totalPages ?? null,
        0,
        defaultCoverPalette.cover,
        defaultCoverPalette.spine,
        input.coverPath ?? null,
        input.isbn ?? null,
        input.genre ?? null,
        input.source ?? "manual",
        now,
        now,
      ],
    );

    const book = await getBookById(db, id);

    if (!book) {
      throw new Error("Book was saved but could not be read back from local SQLite.");
    }

    return book;
  },
  delete: (bookId) => deleteBook(db, bookId),
  getById: (id) => getBookById(db, id),
  list: () => listBooks(db),
  listByStatus: (status) => listBooksByStatus(db, status),
  togglePin: (bookId) => togglePin(db, bookId),
  update: (bookId, input) => updateBook(db, bookId, input),
});

export const updateBook = async (
  db: DatabaseWriter,
  bookId: string,
  input: UpdateBookInput,
): Promise<Book> => {
  const existing = await getBookById(db, bookId);

  if (!existing) {
    throw new Error("Book not found.");
  }

  const totalPages = input.totalPages ?? null;
  const currentPage =
    input.totalPages === undefined
      ? existing.currentPage
      : Math.min(existing.currentPage, input.totalPages);

  await db.runAsync(
    `UPDATE books
     SET title = ?, author = ?, status = ?, total_pages = ?, current_page = ?, cover_path = ?,
       isbn = ?, genre = ?, source = ?, updated_at = ?
     WHERE id = ?;`,
    [
      input.title.trim(),
      input.author.trim(),
      input.status,
      totalPages,
      currentPage,
      input.coverPath ?? null,
      input.isbn ?? null,
      input.genre ?? null,
      input.source ?? existing.source ?? "manual",
      nowIso(),
      bookId,
    ],
  );

  const updated = await getBookById(db, bookId);

  if (!updated) {
    throw new Error("Book was updated but could not be read back from local SQLite.");
  }

  return updated;
};

export const deleteBook = async (db: DatabaseWriter, bookId: string): Promise<void> => {
  await db.runAsync("DELETE FROM books WHERE id = ?;", [bookId]);
};

export const togglePin = async (db: DatabaseWriter, bookId: string): Promise<Book> => {
  await db.runAsync(
    "UPDATE books SET is_pinned = CASE is_pinned WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?;",
    [nowIso(), bookId],
  );

  const updated = await getBookById(db, bookId);

  if (!updated) {
    throw new Error("Book not found.");
  }

  return updated;
};

export const getBookById = async (db: DatabaseReader, id: string): Promise<Book | undefined> => {
  const row = await db.getFirstAsync<BookRow>("SELECT * FROM books WHERE id = ?;", [id]);

  return row ? mapBookRow(row) : undefined;
};

export const listBooks = async (db: DatabaseReader): Promise<Book[]> => {
  const rows = await db.getAllAsync<BookRow>(
    "SELECT * FROM books ORDER BY updated_at DESC, created_at DESC;",
    [],
  );

  return rows.map(mapBookRow);
};

export const listBooksByStatus = async (
  db: DatabaseReader,
  status: BookStatus,
): Promise<Book[]> => {
  const rows = await db.getAllAsync<BookRow>(
    "SELECT * FROM books WHERE status = ? ORDER BY updated_at DESC, created_at DESC;",
    [status],
  );

  return rows.map(mapBookRow);
};

const defaultCoverPalette = {
  cover: "#D6C6A3",
  spine: "#8A5C36",
} as const;
