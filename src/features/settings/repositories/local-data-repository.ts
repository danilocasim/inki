import type { DatabaseWriter } from "../../../lib/db";

const eraseOrder = [
  "share_events",
  "notifications_log",
  "open_library_cache",
  "app_settings",
  "bookmarks",
  "book_notes",
  "quotes",
  "reading_sessions",
  "book_tags",
  "tags",
  "shelf_books",
  "shelves",
  "books"
] as const;

export async function eraseLocalLibraryData(db: DatabaseWriter): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const table of eraseOrder) {
      await txn.runAsync(`DELETE FROM ${table};`);
    }
  });
}
