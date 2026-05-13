import type { SQLiteBindParams, SQLiteRunResult } from "expo-sqlite";

import type { DatabaseWriter } from "../../../lib/db";
import {
  addBookmark,
  addNote,
  addQuote,
  listBookAnnotations
} from "../repositories/annotations-repository";

describe("annotations repository", () => {
  it("lists notes, bookmarks, and quotes for a book", async () => {
    const db = createFakeDatabase();

    const annotations = await listBookAnnotations(db, "book-1");

    expect(annotations.bookmarks).toEqual([
      expect.objectContaining({ bookId: "book-1", label: "big turn", page: 42 })
    ]);
    expect(annotations.notes).toEqual([
      expect.objectContaining({ body: "remember this", bookId: "book-1", page: 43 })
    ]);
    expect(annotations.quotes).toEqual([
      expect.objectContaining({ bookId: "book-1", captureMethod: "manual", text: "The line." })
    ]);
  });

  it("writes annotation rows with normalized input", async () => {
    const db = createFakeDatabase();

    await addBookmark(db, { bookId: "book-1", label: "  saved place ", page: 12 });
    await addNote(db, { body: " note body ", bookId: "book-1", page: 13 });
    await addQuote(db, { bookId: "book-1", text: " quoted text " });

    expect(db.runs[0]?.source).toContain("INSERT INTO bookmarks");
    expect(db.runs[0]?.params?.slice(1, 5)).toEqual(["book-1", 12, "saved place", null]);
    expect(db.runs[1]?.source).toContain("INSERT INTO book_notes");
    expect(db.runs[1]?.params?.slice(1, 5)).toEqual(["book-1", null, "note body", 13]);
    expect(db.runs[2]?.source).toContain("INSERT INTO quotes");
    expect(db.runs[2]?.params?.slice(1, 6)).toEqual(["book-1", "quoted text", null, null, "manual"]);
  });
});

interface CapturedRun {
  params: readonly unknown[] | undefined;
  source: string;
}

interface FakeDatabase extends DatabaseWriter {
  runs: CapturedRun[];
}

function createFakeDatabase(): FakeDatabase {
  const runs: CapturedRun[] = [];

  return {
    runs,
    async execAsync() {
      return undefined;
    },
    async getAllAsync<T>(source: string): Promise<T[]> {
      if (source.includes("FROM bookmarks")) {
        return [
          {
            book_id: "book-1",
            created_at: "2026-05-14T00:00:00.000Z",
            id: "bookmark-1",
            label: "big turn",
            note: null,
            page: 42,
            updated_at: "2026-05-14T00:00:00.000Z"
          }
        ] as T[];
      }

      if (source.includes("FROM book_notes")) {
        return [
          {
            body: "remember this",
            book_id: "book-1",
            created_at: "2026-05-14T00:00:00.000Z",
            id: "note-1",
            page: 43,
            title: null,
            updated_at: "2026-05-14T00:00:00.000Z"
          }
        ] as T[];
      }

      return [
        {
          book_id: "book-1",
          capture_method: "manual",
          created_at: "2026-05-14T00:00:00.000Z",
          id: "quote-1",
          page: null,
          source_image_path: null,
          text: "The line.",
          updated_at: "2026-05-14T00:00:00.000Z"
        }
      ] as T[];
    },
    async getFirstAsync() {
      return null;
    },
    async runAsync(source: string, params?: SQLiteBindParams): Promise<SQLiteRunResult> {
      runs.push({ params: Array.isArray(params) ? params : undefined, source });

      return { changes: 1, lastInsertRowId: runs.length };
    },
    async withExclusiveTransactionAsync(task) {
      await task(this);
    }
  };
}
