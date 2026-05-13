import type { Book } from "../../books/types";
import type { DashboardData, StatValue } from "../types";

export const buildDashboardData = (books: readonly Book[]): DashboardData => {
  const activeBooks = books.filter((book) => book.status === "reading");
  const finishedBooks = books.filter((book) => book.status === "finished" || book.status === "recent");
  const totalPages = books.reduce((sum, book) => sum + book.currentPage, 0);
  const changedCount = books.filter((book) => book.isChangedYou).length;

  return {
    activeBooks: activeBooks.length > 0 ? activeBooks : books.slice(0, 6),
    books: [...books],
    pulseItems: buildPulseItems(activeBooks, finishedBooks),
    stats: [
      { detail: "this week", label: "bookmarks", value: "7" },
      { detail: "days alive", label: "continuity", value: "84" }
    ],
    yearlyStats: [
      { detail: "books this year", label: "books", value: String(finishedBooks.length) },
      { detail: "reading streak", label: "streak", value: "12 d" },
      { detail: "ink density", label: "pages", value: totalPages.toLocaleString("en-US") },
      { detail: "changed me", label: "changed", value: String(changedCount) }
    ] satisfies StatValue[]
  };
};

const buildPulseItems = (activeBooks: readonly Book[], finishedBooks: readonly Book[]): string[] => {
  const current = activeBooks[0]?.title ?? "your current book";
  const finished = finishedBooks[0]?.title ?? "a finished book";

  return [
    `42 pg today in ${current}`,
    `${finishedBooks.length} finished books in your local archive`,
    `Latest reflection saved from ${finished}`
  ];
};
