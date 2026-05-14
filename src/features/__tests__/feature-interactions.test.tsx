import { fireEvent, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { renderWithProviders } from "../../test/render";
import { PrivateProfileScreen } from "../profile/PrivateProfileScreen";
import { SettingsScreen } from "../settings/SettingsScreen";
import { WrappedScreen } from "../share-cards/screens/WrappedScreen";
import { ShelfDetailScreen } from "../shelves/ShelfDetailScreen";
import type { Book } from "../books/types";
import type { Shelf } from "../shelves/types";

const shelfBook = {
  author: "Susanna Clarke",
  currentPage: 104,
  id: "piranesi",
  isChangedYou: false,
  isPinned: false,
  palette: { cover: "#D6C6A3", spine: "#8A5C36", text: "#FFF9F0" },
  progress: 42,
  status: "reading",
  title: "Piranesi",
  totalPages: 248,
  year: "2026",
} satisfies Book;

const availableBook = {
  ...shelfBook,
  author: "Ursula K. Le Guin",
  id: "left-hand",
  title: "The Left Hand of Darkness",
} satisfies Book;

const customShelf = {
  accent: "#264A78",
  books: [shelfBook],
  count: 1,
  id: "shelf-a",
  kind: "custom",
  subtitle: "private shelf",
  title: "Late Night Reads",
} satisfies Shelf;

describe("feature interactions", () => {
  it("removes iCloud sync from settings", () => {
    renderWithProviders(<SettingsScreen />);

    expect(screen.queryByText("iCloud sync")).toBeNull();
    expect(screen.getByText("export all data")).toBeTruthy();
  });

  it("routes profile rows to their concrete feature actions", () => {
    const opened: string[] = [];

    renderWithProviders(
      <PrivateProfileScreen
        onExportLibrary={() => {
          opened.push("export");
        }}
        onOpenNotifications={() => opened.push("notifications")}
        onOpenPassport={() => opened.push("passport")}
        onOpenSettings={() => opened.push("settings")}
        onOpenWrapped={() => opened.push("wrapped")}
      />,
    );

    fireEvent.press(screen.getByText("reading wrapped"));
    fireEvent.press(screen.getByText("annual passport"));
    fireEvent.press(screen.getByText("export library"));
    fireEvent.press(screen.getByText("open notifications"));

    expect(opened).toEqual(["wrapped", "passport", "export", "notifications"]);
  });

  it("supports explicit wrapped card previous and next navigation", () => {
    renderWithProviders(<WrappedScreen />);

    expect(screen.getByText("books read")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Next share card"));
    expect(screen.getByText("midnight")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Previous share card"));
    expect(screen.getByText("books read")).toBeTruthy();
  });

  it("shares shelves, adds books, and lets spine titles be selected", () => {
    let added = false;
    let shared = false;

    renderWithProviders(
      <ShelfDetailScreen
        onAddBook={() => {
          added = true;
        }}
        onShareShelf={() => {
          shared = true;
        }}
        onViewChange={noop}
        shelfId="midnight-reads"
        view="spine"
      />,
    );

    fireEvent.press(screen.getByLabelText("Select Piranesi"));
    expect(screen.getAllByText("Piranesi").length).toBeGreaterThan(0);

    fireEvent.press(screen.getByText("add book"));
    expect(added).toBe(true);

    fireEvent.press(screen.getByText("share shelf"));
    expect(shared).toBe(true);
  });

  it("keeps sparse shelf grid books grouped instead of stretching to opposite edges", () => {
    renderWithProviders(
      <ShelfDetailScreen
        onViewChange={noop}
        shelf={{ ...customShelf, books: [shelfBook, availableBook], count: 2 }}
        shelfId="shelf-a"
        view="grid"
      />,
    );

    const grid = screen.getByTestId("shelf-book-grid");

    expect(StyleSheet.flatten(grid.props.style)).toEqual(
      expect.objectContaining({ justifyContent: "flex-start" }),
    );
  });

  it("manages shelf metadata and membership from shelf detail", () => {
    const addedExisting: string[] = [];
    let deletedShelf = false;
    const removedBooks: string[] = [];
    const updatedNames: string[] = [];

    renderWithProviders(
      <ShelfDetailScreen
        availableBooks={[availableBook]}
        onAddExistingBook={(bookId) => addedExisting.push(bookId)}
        onDeleteShelf={() => {
          deletedShelf = true;
        }}
        onRemoveBook={(bookId) => removedBooks.push(bookId)}
        onUpdateShelf={(input) => updatedNames.push(input.name)}
        onViewChange={noop}
        shelf={customShelf}
        shelfId="shelf-a"
        view="list"
      />,
    );

    fireEvent.press(screen.getByText("edit shelf"));
    fireEvent.changeText(screen.getByLabelText("Shelf name"), "Night shelf");
    fireEvent.press(screen.getByText("save shelf"));
    fireEvent.press(screen.getByText("add existing"));
    fireEvent.press(screen.getByLabelText("Add The Left Hand of Darkness to shelf"));
    fireEvent.press(screen.getByLabelText("Remove Piranesi from shelf"));
    fireEvent.press(screen.getByText("delete shelf"));

    expect(updatedNames).toEqual(["Night shelf"]);
    expect(addedExisting).toEqual(["left-hand"]);
    expect(removedBooks).toEqual(["piranesi"]);
    expect(deletedShelf).toBe(true);
  });

  it("edits profile identity fields", () => {
    const savedHandles: string[] = [];

    renderWithProviders(
      <PrivateProfileScreen
        onOpenSettings={noop}
        onSaveProfile={(profile) => {
          savedHandles.push(profile.handle);
        }}
        profile={{
          avatarPath: undefined,
          bio: "Local reader",
          displayName: "Anya",
          handle: "@anya",
          readerSince: "Jan 2026",
        }}
      />,
    );

    fireEvent.press(screen.getByText("edit profile"));
    fireEvent.changeText(screen.getByLabelText("Profile handle"), "@inki_reader");
    fireEvent.press(screen.getByText("save profile"));

    expect(savedHandles).toEqual(["@inki_reader"]);
    expect(screen.getByText("change photo")).toBeTruthy();
  });
});

const noop = (): void => undefined;
