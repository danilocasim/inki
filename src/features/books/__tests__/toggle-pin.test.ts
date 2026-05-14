import type { SQLiteBindParams, SQLiteRunResult } from "expo-sqlite";

import type { DatabaseWriter } from "../../../lib/db";
import { togglePin } from "../repositories/books-repository";
import type { BookRow } from "../types";

interface FakeDb extends DatabaseWriter {
  state: { isPinned: 0 | 1 };
}

const baseRow: BookRow = {
  author: "Author",
  cover_color: "#000",
  cover_path: null,
  created_at: "2026-05-14T00:00:00.000Z",
  current_page: 0,
  finished_at: null,
  genre: null,
  id: "book-1",
  isbn: null,
  is_changed_you: 0,
  is_pinned: 0,
  mood_tag: null,
  source: null,
  spine_color: "#111",
  started_at: null,
  status: "reading",
  title: "Title",
  total_pages: null,
  updated_at: "2026-05-14T00:00:00.000Z",
};

const createFakeDb = (initialPinned: 0 | 1 = 0): FakeDb => {
  const state: { isPinned: 0 | 1 } = { isPinned: initialPinned };

  return {
    state,
    async execAsync() {
      return undefined;
    },
    async getAllAsync<T>(): Promise<T[]> {
      return [] as T[];
    },
    async getFirstAsync<T>(source: string): Promise<T | null> {
      if (source.includes("FROM books WHERE id")) {
        return { ...baseRow, is_pinned: state.isPinned } as T;
      }
      return null;
    },
    async runAsync(source: string, _params?: SQLiteBindParams): Promise<SQLiteRunResult> {
      if (source.includes("UPDATE books SET is_pinned")) {
        state.isPinned = state.isPinned === 1 ? 0 : 1;
      }
      return { changes: 1, lastInsertRowId: 0 };
    },
    async withExclusiveTransactionAsync(task) {
      await task(this);
    },
  };
};

describe("togglePin", () => {
  it("flips isPinned from false to true and back", async () => {
    const db = createFakeDb(0);

    const first = await togglePin(db, "book-1");
    expect(first.isPinned).toBe(true);

    const second = await togglePin(db, "book-1");
    expect(second.isPinned).toBe(false);
  });

  it("double-toggle returns the book to its original isPinned state (idempotence)", async () => {
    const dbStartUnpinned = createFakeDb(0);
    await togglePin(dbStartUnpinned, "book-1");
    const back = await togglePin(dbStartUnpinned, "book-1");
    expect(back.isPinned).toBe(false);

    const dbStartPinned = createFakeDb(1);
    await togglePin(dbStartPinned, "book-1");
    const backToPinned = await togglePin(dbStartPinned, "book-1");
    expect(backToPinned.isPinned).toBe(true);
  });

  it("throws 'Book not found.' when the book id does not exist", async () => {
    const db: DatabaseWriter = {
      async execAsync() {},
      async getAllAsync<T>() {
        return [] as T[];
      },
      async getFirstAsync() {
        return null;
      },
      async runAsync(): Promise<SQLiteRunResult> {
        return { changes: 0, lastInsertRowId: 0 };
      },
      async withExclusiveTransactionAsync(task) {
        await task(this);
      },
    };

    await expect(togglePin(db, "missing")).rejects.toThrow("Book not found.");
  });
});
