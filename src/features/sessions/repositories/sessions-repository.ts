import type { DatabaseWriter } from "../../../lib/db";
import { createLocalId, nowIso } from "../../../lib/time";
import type { UpdateBookProgressInput } from "../../books/types";

export interface SessionsRepository {
  addProgress(input: UpdateBookProgressInput): Promise<void>;
}

export const createSessionsRepository = (db: DatabaseWriter): SessionsRepository => ({
  async addProgress(input) {
    const now = nowIso();

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `INSERT INTO reading_sessions (
          id, book_id, pages_read, ended_page, duration_minutes, note, read_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          createLocalId("session"),
          input.bookId,
          input.pagesRead,
          input.currentPage,
          input.durationMinutes ?? null,
          input.note ?? null,
          input.readAt,
          now
        ]
      );

      await txn.runAsync(
        `UPDATE books
         SET current_page = ?, updated_at = ?, status = CASE
           WHEN total_pages IS NOT NULL AND ? >= total_pages THEN 'finished'
           ELSE status
         END,
         finished_at = CASE
           WHEN total_pages IS NOT NULL AND ? >= total_pages THEN ?
           ELSE finished_at
         END
         WHERE id = ?;`,
        [input.currentPage, now, input.currentPage, input.currentPage, input.readAt, input.bookId]
      );
    });
  }
});
