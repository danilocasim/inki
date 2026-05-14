import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { BookDetailScreen } from "../screens/BookDetailScreen";
import type { Book } from "../types";
import { renderWithProviders } from "../../../test/render";

jest.mock("../../quotes/hooks/use-book-annotations", () => ({
  useBookAnnotations: () => ({
    bookmarks: [],
    error: undefined,
    loading: false,
    notes: [],
    quotes: [],
    reload: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock("../../quotes/hooks/use-save-annotation", () => ({
  useSaveAnnotation: () => ({
    error: undefined,
    loading: false,
    saveBookmark: jest.fn(() => Promise.resolve(undefined)),
    saveNote: jest.fn(() => Promise.resolve(undefined)),
    saveQuote: jest.fn(() => Promise.resolve(undefined)),
  }),
}));

jest.mock("../../sessions/hooks/use-save-session", () => ({
  useSaveSession: () => ({
    error: undefined,
    loading: false,
    saveSession: jest.fn(() => Promise.resolve(true)),
  }),
}));

const book = {
  author: "Susanna Clarke",
  currentPage: 104,
  genre: "fantasy",
  id: "book-1",
  isChangedYou: false,
  isPinned: false,
  palette: { cover: "#D6C6A3", spine: "#8A5C36", text: "#FFF9F0" },
  progress: 42,
  status: "reading",
  title: "Piranesi",
  totalPages: 248,
  year: "2026",
} satisfies Book;

describe("BookDetailScreen", () => {
  it("edits and deletes a book from the detail management controls", async () => {
    const onDeleteBook = jest.fn(() => Promise.resolve());
    const onUpdateBook = jest.fn(() => Promise.resolve());

    renderWithProviders(
      <BookDetailScreen book={book} onDeleteBook={onDeleteBook} onUpdateBook={onUpdateBook} />,
    );

    fireEvent.press(screen.getByText("edit book"));
    fireEvent.changeText(screen.getByLabelText("TITLE"), "Piranesi revised");
    fireEvent.press(screen.getByText("save changes"));

    await waitFor(() => {
      expect(onUpdateBook).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Piranesi revised" }),
      );
    });

    fireEvent.press(screen.getByText("delete book"));

    expect(onDeleteBook).toHaveBeenCalled();
  });
});
