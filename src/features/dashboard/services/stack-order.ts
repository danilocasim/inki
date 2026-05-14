import type { Book, BookStatus } from "../../books/types";

const statusOrder: Record<BookStatus, number> = {
  reading: 0,
  recent: 1,
  finished: 2,
  "want-to-read": 3,
  "not-yet": 4,
};

/**
 * Sort books for The Stack:
 *   1. by status (reading → recent → finished → want-to-read → not-yet)
 *   2. pinned books first within each status group
 *   3. higher progress first
 *   4. alphabetical title (stable tiebreak)
 *
 * Pure & idempotent — running it twice yields the same list.
 */
export const orderBooksForStack = (books: readonly Book[]): Book[] =>
  [...books].sort((left, right) => {
    const statusDelta = statusOrder[left.status] - statusOrder[right.status];
    if (statusDelta !== 0) return statusDelta;

    const pinDelta = Number(right.isPinned) - Number(left.isPinned);
    if (pinDelta !== 0) return pinDelta;

    const progressDelta = (right.progress ?? 0) - (left.progress ?? 0);
    if (progressDelta !== 0) return progressDelta;

    return left.title.localeCompare(right.title);
  });
