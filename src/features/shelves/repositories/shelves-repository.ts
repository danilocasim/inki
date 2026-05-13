import type { DatabaseReader, DatabaseWriter } from "../../../lib/db";
import { createLocalId, nowIso } from "../../../lib/time";
import type { BookRow } from "../../books/types";
import { mapBookRow } from "../../books/types";
import type { CreateShelfInput, Shelf, ShelfRow } from "../types";
import { mapShelfRow } from "../types";

export interface ShelvesRepository {
  create(input: CreateShelfInput): Promise<Shelf>;
  getById(id: string): Promise<Shelf | undefined>;
  list(): Promise<Shelf[]>;
}

export const createShelvesRepository = (db: DatabaseWriter): ShelvesRepository => ({
  create: (input) => createShelf(db, input),
  getById: (id) => getShelfById(db, id),
  list: () => listShelves(db)
});

export const createShelf = async (
  db: DatabaseWriter,
  input: CreateShelfInput
): Promise<Shelf> => {
  const name = input.name.trim();

  if (name.length === 0) {
    throw new Error("Shelf name is required.");
  }

  const id = createLocalId("shelf");
  const now = nowIso();
  const sortRow = await db.getFirstAsync<{ sort_order: number }>(
    "SELECT COALESCE(MAX(sort_order), 0) + 10 AS sort_order FROM shelves WHERE kind = 'custom';"
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
      now
    ]
  );

  const shelf = await getShelfById(db, id);

  if (!shelf) {
    throw new Error("Shelf was saved but could not be read back from local SQLite.");
  }

  return shelf;
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
    []
  );

  return rows.map(mapShelfRow);
};

export const getShelfById = async (
  db: DatabaseReader,
  id: string
): Promise<Shelf | undefined> => {
  const row = await db.getFirstAsync<ShelfRow>(
    `SELECT shelves.id, shelves.name, shelves.description, shelves.accent, shelves.kind,
      shelves.sort_order, COUNT(shelf_books.book_id) AS book_count
     FROM shelves
     LEFT JOIN shelf_books ON shelf_books.shelf_id = shelves.id
     WHERE shelves.id = ?
     GROUP BY shelves.id;`,
    [id]
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
    [shelfId]
  );

  return rows.map(mapBookRow);
};

const shelfAccents = ["#66539A", "#346A56", "#855024", "#264A78", "#9D4142"] as const;

const shelfAccentForName = (name: string): string => {
  const index = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0) % shelfAccents.length;

  return shelfAccents[index] ?? shelfAccents[0];
};
