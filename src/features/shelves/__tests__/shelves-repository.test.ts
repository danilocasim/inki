import type { SQLiteBindParams, SQLiteRunResult } from "expo-sqlite";

import type { DatabaseWriter } from "../../../lib/db";
import {
  addBookToShelf,
  listShelvesForBook,
  removeBookFromShelf,
} from "../repositories/shelves-repository";

interface ShelfRowData {
  id: string;
  name: string;
  description: string | null;
  accent: string;
  kind: "custom" | "system";
  sort_order: number;
  created_at: string;
}

interface MembershipRow {
  shelf_id: string;
  book_id: string;
}

interface FakeDb extends DatabaseWriter {
  members: MembershipRow[];
}

const seedShelves: ShelfRowData[] = [
  {
    id: "shelf-a",
    name: "Late Night Reads",
    description: null,
    accent: "#264A78",
    kind: "custom",
    sort_order: 10,
    created_at: "2026-05-14T00:00:00.000Z",
  },
  {
    id: "shelf-b",
    name: "Travel",
    description: null,
    accent: "#346A56",
    kind: "custom",
    sort_order: 20,
    created_at: "2026-05-14T00:00:00.000Z",
  },
];

const createFakeDb = (initialMembers: MembershipRow[] = []): FakeDb => {
  const members: MembershipRow[] = [...initialMembers];

  return {
    members,
    async execAsync() {
      return undefined;
    },
    async getAllAsync<T>(source: string, params?: SQLiteBindParams): Promise<T[]> {
      if (!source.includes("INNER JOIN shelf_books AS member")) {
        return [] as T[];
      }
      const args = Array.isArray(params) ? params : [];
      const bookId = String(args[0] ?? "");
      const matchingShelfIds = new Set(
        members.filter((row) => row.book_id === bookId).map((row) => row.shelf_id),
      );
      return seedShelves
        .filter((shelf) => matchingShelfIds.has(shelf.id))
        .map((shelf) => ({
          ...shelf,
          book_count: members.filter((row) => row.shelf_id === shelf.id).length,
        })) as unknown as T[];
    },
    async getFirstAsync() {
      return null;
    },
    async runAsync(source: string, params?: SQLiteBindParams): Promise<SQLiteRunResult> {
      const args = Array.isArray(params) ? params : [];

      if (source.includes("INSERT OR IGNORE INTO shelf_books")) {
        const [shelfId, bookId] = args as [string, string];
        const exists = members.some(
          (row) => row.shelf_id === shelfId && row.book_id === bookId,
        );
        if (!exists) {
          members.push({ shelf_id: shelfId, book_id: bookId });
        }
        return { changes: exists ? 0 : 1, lastInsertRowId: 0 };
      }

      if (source.includes("DELETE FROM shelf_books")) {
        const [shelfId, bookId] = args as [string, string];
        const before = members.length;
        for (let i = members.length - 1; i >= 0; i -= 1) {
          const row = members[i]!;
          if (row.shelf_id === shelfId && row.book_id === bookId) {
            members.splice(i, 1);
          }
        }
        return { changes: before - members.length, lastInsertRowId: 0 };
      }

      return { changes: 0, lastInsertRowId: 0 };
    },
    async withExclusiveTransactionAsync(task) {
      await task(this);
    },
  };
};

describe("shelves repository — membership round-trip", () => {
  it("addBook then listShelvesForBook returns that shelf (round-trip)", async () => {
    const db = createFakeDb();
    await addBookToShelf(db, "shelf-a", "book-1");

    const shelves = await listShelvesForBook(db, "book-1");

    expect(shelves.map((s) => s.id)).toContain("shelf-a");
  });

  it("removeBook then listShelvesForBook does not return that shelf", async () => {
    const db = createFakeDb([{ shelf_id: "shelf-a", book_id: "book-1" }]);
    await removeBookFromShelf(db, "shelf-a", "book-1");

    const shelves = await listShelvesForBook(db, "book-1");

    expect(shelves.map((s) => s.id)).not.toContain("shelf-a");
  });

  it("addBook is a no-op when called twice (idempotent)", async () => {
    const db = createFakeDb();
    await addBookToShelf(db, "shelf-a", "book-1");
    await addBookToShelf(db, "shelf-a", "book-1");

    const matching = db.members.filter(
      (row) => row.shelf_id === "shelf-a" && row.book_id === "book-1",
    );
    expect(matching).toHaveLength(1);
  });

  it("removeBook is a no-op when membership does not exist", async () => {
    const db = createFakeDb();
    await expect(removeBookFromShelf(db, "shelf-a", "book-1")).resolves.toBeUndefined();
  });
});
