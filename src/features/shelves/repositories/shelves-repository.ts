import type { DatabaseReader, DatabaseWriter } from "../../../lib/db";
import { createLocalId, nowIso } from "../../../lib/time";
import type { Book, BookRow } from "../../books/types";
import { mapBookRow } from "../../books/types";
import type { CreateShelfInput, Shelf, ShelfRow, UpdateShelfInput } from "../types";
import { mapShelfRow } from "../types";

export interface ShelvesRepository {
  addBook(shelfId: string, bookId: string): Promise<void>;
  create(input: CreateShelfInput): Promise<Shelf>;
  delete(shelfId: string): Promise<void>;
  getById(id: string): Promise<Shelf | undefined>;
  list(): Promise<Shelf[]>;
  listBooksNotInShelf(shelfId: string): Promise<Book[]>;
  listShelvesForBook(bookId: string): Promise<Shelf[]>;
  removeBook(shelfId: string, bookId: string): Promise<void>;
  update(shelfId: string, input: UpdateShelfInput): Promise<Shelf>;
}

export const createShelvesRepository = (db: DatabaseWriter): ShelvesRepository => ({
  addBook: (shelfId, bookId) => addBookToShelf(db, shelfId, bookId),
  create: (input) => createShelf(db, input),
  delete: (shelfId) => deleteShelf(db, shelfId),
  getById: (id) => getShelfById(db, id),
  list: () => listShelves(db),
  listBooksNotInShelf: (shelfId) => listBooksNotInShelf(db, shelfId),
  listShelvesForBook: (bookId) => listShelvesForBook(db, bookId),
  removeBook: (shelfId, bookId) => removeBookFromShelf(db, shelfId, bookId),
  update: (shelfId, input) => updateShelf(db, shelfId, input),
});

export const addBookToShelf = async (
  db: DatabaseWriter,
  shelfId: string,
  bookId: string,
): Promise<void> => {
  await db.runAsync(
    `INSERT OR IGNORE INTO shelf_books (shelf_id, book_id, sort_order, added_at)
     VALUES (?, ?, 0, ?);`,
    [shelfId, bookId, nowIso()],
  );
};

export const removeBookFromShelf = async (
  db: DatabaseWriter,
  shelfId: string,
  bookId: string,
): Promise<void> => {
  await db.runAsync("DELETE FROM shelf_books WHERE shelf_id = ? AND book_id = ?;", [
    shelfId,
    bookId,
  ]);
};

export const listShelvesForBook = async (db: DatabaseReader, bookId: string): Promise<Shelf[]> => {
  const rows = await db.getAllAsync<ShelfRow>(
    `SELECT shelves.id, shelves.name, shelves.description, shelves.accent, shelves.kind,
      shelves.sort_order, COUNT(other.book_id) AS book_count
     FROM shelves
     INNER JOIN shelf_books AS member ON member.shelf_id = shelves.id AND member.book_id = ?
     LEFT JOIN shelf_books AS other ON other.shelf_id = shelves.id
     WHERE shelves.kind = 'custom'
     GROUP BY shelves.id
     ORDER BY shelves.sort_order ASC, shelves.created_at ASC;`,
    [bookId],
  );

  return rows.map(mapShelfRow);
};

export const createShelf = async (db: DatabaseWriter, input: CreateShelfInput): Promise<Shelf> => {
  const name = input.name.trim();

  if (name.length === 0) {
    throw new Error("Shelf name is required.");
  }

  const id = createLocalId("shelf");
  const now = nowIso();
  const sortRow = await db.getFirstAsync<{ sort_order: number }>(
    "SELECT COALESCE(MAX(sort_order), 0) + 10 AS sort_order FROM shelves WHERE kind = 'custom';",
  );

  await db.runAsync(
    `INSERT INTO shelves (id, name, description, accent, kind, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      name,
      input.description?.trim() || null,
      shelfAccentForName(name),
      "custom",
      sortRow?.sort_order ?? 10,
      now,
      now,
    ],
  );

  const shelf = await getShelfById(db, id);

  if (!shelf) {
    throw new Error("Shelf was saved but could not be read back from local SQLite.");
  }

  return shelf;
};

export const updateShelf = async (
  db: DatabaseWriter,
  shelfId: string,
  input: UpdateShelfInput,
): Promise<Shelf> => {
  const existing = await getShelfById(db, shelfId);

  if (!existing) {
    throw new Error("Shelf not found.");
  }

  if (existing.kind !== "custom") {
    throw new Error("System shelves cannot be edited.");
  }

  const name = input.name.trim();

  if (name.length === 0) {
    throw new Error("Shelf name is required.");
  }

  await db.runAsync(
    `UPDATE shelves
     SET name = ?, description = ?, accent = ?, updated_at = ?
     WHERE id = ?;`,
    [
      name,
      input.description?.trim() || null,
      input.accent?.trim() || existing.accent,
      nowIso(),
      shelfId,
    ],
  );

  const updated = await getShelfById(db, shelfId);

  if (!updated) {
    throw new Error("Shelf was updated but could not be read back from local SQLite.");
  }

  return updated;
};

export const deleteShelf = async (db: DatabaseWriter, shelfId: string): Promise<void> => {
  const existing = await getShelfById(db, shelfId);

  if (!existing) {
    throw new Error("Shelf not found.");
  }

  if (existing.kind !== "custom") {
    throw new Error("System shelves cannot be deleted.");
  }

  await db.runAsync("DELETE FROM shelves WHERE id = ?;", [shelfId]);
};

export const listShelves = async (db: DatabaseReader): Promise<Shelf[]> => {
  const rows = await db.getAllAsync<ShelfRow>(
    `SELECT shelves.id, shelves.name, shelves.description, shelves.accent, shelves.kind,
      shelves.sort_order, COUNT(shelf_books.book_id) AS book_count
     FROM shelves
     LEFT JOIN shelf_books ON shelf_books.shelf_id = shelves.id
     WHERE shelves.kind = 'custom'
     GROUP BY shelves.id
     ORDER BY shelves.sort_order ASC, shelves.created_at ASC;`,
    [],
  );

  return rows.map(mapShelfRow);
};

export const getShelfById = async (db: DatabaseReader, id: string): Promise<Shelf | undefined> => {
  const row = await db.getFirstAsync<ShelfRow>(
    `SELECT shelves.id, shelves.name, shelves.description, shelves.accent, shelves.kind,
      shelves.sort_order, COUNT(shelf_books.book_id) AS book_count
     FROM shelves
     LEFT JOIN shelf_books ON shelf_books.shelf_id = shelves.id
     WHERE shelves.id = ?
     GROUP BY shelves.id;`,
    [id],
  );

  if (!row) {
    return undefined;
  }

  const books = await listShelfBooks(db, id);

  return { ...mapShelfRow(row), books };
};

export const listShelfBooks = async (db: DatabaseReader, shelfId: string) => {
  const rows = await db.getAllAsync<BookRow>(
    `SELECT books.*
     FROM books
     INNER JOIN shelf_books ON shelf_books.book_id = books.id
     WHERE shelf_books.shelf_id = ?
     ORDER BY shelf_books.sort_order ASC, shelf_books.added_at ASC;`,
    [shelfId],
  );

  return rows.map(mapBookRow);
};

export const listBooksNotInShelf = async (db: DatabaseReader, shelfId: string): Promise<Book[]> => {
  const rows = await db.getAllAsync<BookRow>(
    `SELECT books.*
     FROM books
     WHERE NOT EXISTS (
       SELECT 1 FROM shelf_books
       WHERE shelf_books.book_id = books.id AND shelf_books.shelf_id = ?
     )
     ORDER BY books.updated_at DESC, books.created_at DESC;`,
    [shelfId],
  );

  return rows.map(mapBookRow);
};

const shelfAccents = ["#66539A", "#346A56", "#855024", "#264A78", "#9D4142"] as const;

const shelfAccentForName = (name: string): string => {
  const index =
    Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0) % shelfAccents.length;

  return shelfAccents[index] ?? shelfAccents[0];
};
