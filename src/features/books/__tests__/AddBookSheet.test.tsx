import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { AddBookSheet } from "../screens/AddBookSheet";
import type { Book } from "../types";
import { renderWithProviders } from "../../../test/render";

const mockDb = {};
const mockSaveBook = jest.fn();

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => mockDb,
}));

jest.mock("../hooks/use-save-book", () => ({
  useSaveBook: () => ({
    error: undefined,
    loading: false,
    saveBook: mockSaveBook,
  }),
}));

const savedBook = {
  author: "Susanna Clarke",
  currentPage: 0,
  id: "book-1",
  isChangedYou: false,
  isPinned: false,
  palette: { cover: "#D6C6A3", spine: "#8A5C36", text: "#FFF9F0" },
  status: "reading",
  title: "Piranesi",
  year: "2026",
} satisfies Book;

describe("AddBookSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveBook.mockResolvedValue(savedBook);
  });

  it("saves a book with an empty shelf list (shelf assignment moved to long-press flow)", async () => {
    const onSaved = jest.fn();

    renderWithProviders(
      <AddBookSheet
        onClose={jest.fn()}
        onSaved={onSaved}
        onScanBarcode={jest.fn()}
        onScanQuote={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText("Enter manually"));

    fireEvent.changeText(screen.getByLabelText("TITLE"), "Piranesi");
    fireEvent.changeText(screen.getByLabelText("AUTHOR"), "Susanna Clarke");
    fireEvent.press(screen.getByText("Save book"));

    await waitFor(() => {
      expect(mockSaveBook).toHaveBeenCalledWith(expect.objectContaining({ title: "Piranesi" }), {
        shelfIds: [],
      });
    });
    expect(onSaved).toHaveBeenCalledWith("book-1");
  });
});
