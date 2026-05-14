import type { Book, BookStatus } from "../../books/types";
import { orderBooksForStack } from "../services/stack-order";

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  author: "Author",
  currentPage: 0,
  id: overrides.title ?? "id",
  isChangedYou: false,
  isPinned: false,
  palette: { cover: "#000", spine: "#000", text: "#fff" },
  status: "reading",
  title: "Untitled",
  year: "2026",
  ...overrides,
});

describe("orderBooksForStack", () => {
  it("places pinned books before unpinned within the same status group", () => {
    const books: Book[] = [
      makeBook({ id: "a", title: "A", status: "reading", isPinned: false, progress: 50 }),
      makeBook({ id: "b", title: "B", status: "reading", isPinned: true, progress: 10 }),
      makeBook({ id: "c", title: "C", status: "reading", isPinned: false, progress: 90 }),
      makeBook({ id: "d", title: "D", status: "reading", isPinned: true, progress: 30 }),
    ];

    const ordered = orderBooksForStack(books).map((book) => book.id);

    // Pinned (b, d) come before unpinned (c, a) within the reading group.
    expect(ordered.indexOf("b")).toBeLessThan(ordered.indexOf("a"));
    expect(ordered.indexOf("b")).toBeLessThan(ordered.indexOf("c"));
    expect(ordered.indexOf("d")).toBeLessThan(ordered.indexOf("a"));
    expect(ordered.indexOf("d")).toBeLessThan(ordered.indexOf("c"));
  });

  it("respects status order even when an unpinned reading book is followed by a pinned want-to-read book", () => {
    const books: Book[] = [
      makeBook({ id: "want-pinned", title: "WP", status: "want-to-read", isPinned: true }),
      makeBook({ id: "reading-unpinned", title: "RU", status: "reading", isPinned: false }),
    ];

    const ordered = orderBooksForStack(books).map((book) => book.id);

    expect(ordered).toEqual(["reading-unpinned", "want-pinned"]);
  });

  it("breaks ties on title alphabetically (stable)", () => {
    const books: Book[] = [
      makeBook({ id: "z", title: "Zebra", status: "reading", progress: 50 }),
      makeBook({ id: "a", title: "Apple", status: "reading", progress: 50 }),
      makeBook({ id: "m", title: "Mango", status: "reading", progress: 50 }),
    ];

    const ordered = orderBooksForStack(books).map((book) => book.title);

    expect(ordered).toEqual(["Apple", "Mango", "Zebra"]);
  });

  it("is idempotent: applying twice equals applying once", () => {
    const books: Book[] = [
      makeBook({ id: "a", title: "A", status: "want-to-read" }),
      makeBook({ id: "b", title: "B", status: "reading", isPinned: true, progress: 10 }),
      makeBook({ id: "c", title: "C", status: "finished", progress: 100 }),
      makeBook({ id: "d", title: "D", status: "reading", progress: 80 }),
      makeBook({ id: "e", title: "E", status: "reading", isPinned: true, progress: 5 }),
    ];

    const once = orderBooksForStack(books);
    const twice = orderBooksForStack(once);

    expect(twice.map((book) => book.id)).toEqual(once.map((book) => book.id));
  });

  it("preserves length (no books dropped or duplicated)", () => {
    const statuses: BookStatus[] = ["reading", "recent", "finished", "want-to-read", "not-yet"];
    const books: Book[] = statuses.flatMap((status, i) => [
      makeBook({ id: `${status}-a`, title: `${status}-A`, status, isPinned: i % 2 === 0 }),
      makeBook({ id: `${status}-b`, title: `${status}-B`, status, isPinned: false }),
    ]);

    expect(orderBooksForStack(books).length).toBe(books.length);
  });

  it("does not mutate the input array", () => {
    const books: Book[] = [
      makeBook({ id: "a", title: "A", isPinned: false }),
      makeBook({ id: "b", title: "B", isPinned: true }),
    ];
    const snapshot = books.map((book) => book.id);

    orderBooksForStack(books);

    expect(books.map((book) => book.id)).toEqual(snapshot);
  });
});
