import type { DatabaseReader } from "../../../lib/db";
import type { BookRow } from "../../books/types";
import { mapBookRow } from "../../books/types";
import type { Shelf, ShelfRow } from "../types";
import { mapShelfRow } from "../types";

export interface ShelvesRepository {
  getById(id: string): Promise<Shelf | undefined>;
  list(): Promise<Shelf[]>;
}

export const createShelvesRepository = (db: DatabaseReader): ShelvesRepository => ({
  getById: (id) => getShelfById(db, id),
  list: () => listShelves(db)
});

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
