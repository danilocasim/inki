import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { AddBookSheet } from "../screens/AddBookSheet";
import type { Book } from "../types";
import type { Shelf } from "../../shelves/types";
import { renderWithProviders } from "../../../test/render";

const mockDb = {};
const mockSaveBook = jest.fn();
const mockListShelves = jest.fn();

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

jest.mock("../../shelves/repositories/shelves-repository", () => ({
  listShelves: (...args: unknown[]) => mockListShelves(...args),
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

const shelf = {
  accent: "#264A78",
  count: 2,
  id: "shelf-a",
  kind: "custom",
  subtitle: "private shelf",
  title: "Late Night Reads",
} satisfies Shelf;

describe("AddBookSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListShelves.mockResolvedValue([shelf]);
    mockSaveBook.mockResolvedValue(savedBook);
  });

  it("preselects the route shelf when saving a new book", async () => {
    const onSaved = jest.fn();

    renderWithProviders(
      <AddBookSheet
        initialShelfId="shelf-a"
        onClose={jest.fn()}
        onSaved={onSaved}
        onScanBarcode={jest.fn()}
        onScanQuote={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText("Enter manually"));

    await waitFor(() => {
      expect(screen.getByLabelText("Remove from Late Night Reads")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByLabelText("TITLE"), "Piranesi");
    fireEvent.changeText(screen.getByLabelText("AUTHOR"), "Susanna Clarke");
    fireEvent.press(screen.getByText("Save book"));

    await waitFor(() => {
      expect(mockSaveBook).toHaveBeenCalledWith(expect.objectContaining({ title: "Piranesi" }), {
        shelfIds: ["shelf-a"],
      });
    });
    expect(onSaved).toHaveBeenCalledWith("book-1");
  });
});
