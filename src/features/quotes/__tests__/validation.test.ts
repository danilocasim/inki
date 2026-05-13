import {
  parseCreateBookmarkInput,
  parseCreateBookNoteInput,
  parseCreateQuoteInput
} from "../validation";

describe("annotation validation", () => {
  it("normalizes note, bookmark, and quote input", () => {
    expect(parseCreateBookmarkInput({ bookId: " book-1 ", label: " page marker ", page: 42 })).toEqual({
      bookId: "book-1",
      label: "page marker",
      page: 42
    });

    expect(parseCreateBookNoteInput({ body: " remember this ", bookId: "book-1", page: 9 })).toEqual({
      body: "remember this",
      bookId: "book-1",
      page: 9
    });

    expect(parseCreateQuoteInput({ bookId: "book-1", text: " The line. " })).toEqual({
      bookId: "book-1",
      text: "The line."
    });
  });

  it("rejects empty text and negative pages", () => {
    expect(() => parseCreateBookmarkInput({ bookId: "book-1", page: -1 })).toThrow();
    expect(() => parseCreateBookNoteInput({ body: "", bookId: "book-1" })).toThrow();
    expect(() => parseCreateQuoteInput({ bookId: "book-1", text: "" })).toThrow();
  });
});
