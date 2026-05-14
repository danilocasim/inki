import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { BookCover } from "../books/BookCover";
import type { Book } from "../books/types";
import {
  getBookById,
  getShelfById,
  shelfViews,
  spineSorts,
  type ShelfView,
} from "../dashboard/fixtures";
import type { Shelf, UpdateShelfInput } from "./types";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { EmptyState } from "../../ui/EmptyState";
import { Screen } from "../../ui/Screen";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";
import { BookSpine } from "./BookSpine";

export interface ShelfDetailScreenProps {
  availableBooks?: readonly Book[] | undefined;
  onAddExistingBook?: (bookId: string) => unknown;
  onAddBook?: () => void;
  onDeleteShelf?: () => Promise<void> | void;
  onOpenBook?: (bookId: string) => void;
  onRemoveBook?: (bookId: string) => unknown;
  onShareShelf?: () => void;
  onUpdateShelf?: (input: UpdateShelfInput) => unknown;
  onViewChange: (view: ShelfView) => void;
  shelf?: Shelf | undefined;
  shelfId: string;
  view: ShelfView;
}

/** Static shelf detail route that switches among grid, list, and spine views. */
export function ShelfDetailScreen({
  availableBooks = [],
  onAddExistingBook = noopExistingBook,
  onAddBook = noop,
  onDeleteShelf = noopAsync,
  onOpenBook = noopOpenBook,
  onRemoveBook,
  onShareShelf = noop,
  onUpdateShelf = noopUpdateShelf,
  onViewChange,
  shelf: providedShelf,
  shelfId,
  view,
}: ShelfDetailScreenProps): ReactElement {
  const [editingShelf, setEditingShelf] = useState(false);
  const [addingExisting, setAddingExisting] = useState(false);
  const [shelfDraft, setShelfDraft] = useState({ description: "", name: "" });
  const [managementError, setManagementError] = useState<string | undefined>();
  const fixtureShelf = getShelfById(shelfId);
  const shelf =
    providedShelf ??
    (fixtureShelf
      ? {
          accent: fixtureShelf.accent,
          books: fixtureShelf.bookIds.map(getBookById).map((book) => ({
            author: book.author,
            currentPage: book.progress ?? 0,
            genre: book.genre,
            id: book.id,
            isChangedYou: false,
            isPinned: false,
            palette: book.palette,
            progress: book.progress,
            status: book.status,
            title: book.title,
            year: book.year,
          })),
          count: fixtureShelf.bookIds.length,
          id: fixtureShelf.id,
          kind: "custom" as const,
          subtitle: fixtureShelf.subtitle,
          title: fixtureShelf.title,
        }
      : undefined);
  const shelfSubtitle = shelf?.subtitle;
  const shelfTitle = shelf?.title;

  useEffect(() => {
    if (shelfTitle !== undefined) {
      setShelfDraft({ description: shelfSubtitle ?? "", name: shelfTitle });
    }
  }, [shelfSubtitle, shelfTitle]);

  if (!shelf) {
    return (
      <Screen title="shelf">
        <EmptyState
          message="This local shelf fixture is not available yet."
          title="Shelf not found"
        />
      </Screen>
    );
  }

  const books = shelf.books ?? [];

  const handleUpdateShelf = (): void => {
    const name = shelfDraft.name.trim();

    if (name.length === 0) {
      setManagementError("Shelf name is required.");
      return;
    }

    try {
      setManagementError(undefined);
      const result = onUpdateShelf({
        description: shelfDraft.description.trim() || undefined,
        name,
      });

      if (isPromiseLike(result)) {
        void Promise.resolve(result)
          .then(() => setEditingShelf(false))
          .catch((caught: unknown) => {
            setManagementError(
              caught instanceof Error ? caught.message : "Unable to update shelf.",
            );
          });
        return;
      }

      setEditingShelf(false);
    } catch (caught) {
      setManagementError(caught instanceof Error ? caught.message : "Unable to update shelf.");
    }
  };

  const handleShelfAction = async (action: () => unknown): Promise<void> => {
    try {
      setManagementError(undefined);
      await action();
    } catch (caught) {
      setManagementError(caught instanceof Error ? caught.message : "Unable to update shelf.");
    }
  };

  return (
    <Screen subtitle={shelf.subtitle} title={shelf.title}>
      <SegmentedControl onValueChange={onViewChange} options={shelfViews} value={view} />
      {renderShelfView(view, books, onOpenBook)}
      {onRemoveBook ? (
        <ShelfMembershipControls
          books={books}
          onRemoveBook={(bookId) => void handleShelfAction(() => onRemoveBook(bookId))}
        />
      ) : null}
      <View style={styles.actionRow}>
        <Button label="add book" onPress={onAddBook} />
        <Button label="add existing" onPress={() => setAddingExisting((current) => !current)} />
        <Button
          label="edit shelf"
          onPress={() => setEditingShelf((current) => !current)}
          variant="secondary"
        />
        <Button label="share shelf" onPress={onShareShelf} variant="secondary" />
        {shelf.kind === "custom" ? (
          <Button
            label="delete shelf"
            onPress={() => void handleShelfAction(onDeleteShelf)}
            variant="secondary"
          />
        ) : null}
      </View>
      {managementError ? <Text tone="danger">{managementError}</Text> : null}
      {editingShelf ? (
        <Card style={styles.managementCard} variant="ink">
          <Text tone="muted" variant="eyebrow">
            SHELF DETAILS
          </Text>
          <View style={styles.field}>
            <Text tone="muted" variant="eyebrow">
              Shelf name
            </Text>
            <TextInput
              accessibilityLabel="Shelf name"
              onChangeText={(name) => setShelfDraft((current) => ({ ...current, name }))}
              placeholderTextColor={tokens.color.muted}
              style={styles.input}
              value={shelfDraft.name}
            />
          </View>
          <View style={styles.field}>
            <Text tone="muted" variant="eyebrow">
              Description
            </Text>
            <TextInput
              accessibilityLabel="Shelf description"
              multiline
              onChangeText={(description) =>
                setShelfDraft((current) => ({ ...current, description }))
              }
              placeholderTextColor={tokens.color.muted}
              style={[styles.input, styles.multilineInput]}
              value={shelfDraft.description}
            />
          </View>
          <Button label="save shelf" onPress={handleUpdateShelf} />
        </Card>
      ) : null}
      {addingExisting ? (
        <Card style={styles.managementCard} variant="ink">
          <Text tone="muted" variant="eyebrow">
            ADD EXISTING BOOK
          </Text>
          {availableBooks.length > 0 ? (
            <View style={styles.availableList}>
              {availableBooks.map((book) => (
                <Pressable
                  accessibilityLabel={`Add ${book.title} to shelf`}
                  accessibilityRole="button"
                  key={book.id}
                  onPress={() => void handleShelfAction(() => onAddExistingBook(book.id))}
                  style={styles.availableRow}
                >
                  <View style={[styles.availableSwatch, { backgroundColor: book.palette.spine }]} />
                  <View style={styles.availableCopy}>
                    <Text variant="bodyStrong">{book.title}</Text>
                    <Text tone="muted" variant="caption">
                      {book.author}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text tone="muted" variant="caption">
              No books outside this shelf.
            </Text>
          )}
        </Card>
      ) : null}
    </Screen>
  );
}

function ShelfMembershipControls({
  books,
  onRemoveBook,
}: {
  books: readonly Book[];
  onRemoveBook: (bookId: string) => void;
}): ReactElement | null {
  if (books.length === 0) {
    return null;
  }

  return (
    <Card style={styles.membershipCard} variant="ink">
      <Text tone="muted" variant="eyebrow">
        BOOKS ON THIS SHELF
      </Text>
      <View style={styles.membershipList}>
        {books.map((book) => (
          <Pressable
            accessibilityLabel={`Remove ${book.title} from shelf`}
            accessibilityRole="button"
            key={book.id}
            onPress={() => onRemoveBook(book.id)}
            style={styles.membershipRow}
          >
            <View style={[styles.availableSwatch, { backgroundColor: book.palette.spine }]} />
            <View style={styles.availableCopy}>
              <Text variant="bodyStrong">{book.title}</Text>
              <Text tone="muted" variant="caption">
                tap to remove from this shelf
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const renderShelfView = (
  view: ShelfView,
  books: readonly Book[],
  onOpenBook: (bookId: string) => void,
): ReactElement => {
  switch (view) {
    case "grid":
      return <GridView books={books} onOpenBook={onOpenBook} />;
    case "list":
      return <ListView books={books} onOpenBook={onOpenBook} />;
    case "spine":
      return <SpineView books={books} onOpenBook={onOpenBook} />;
  }
};

function GridView({
  books,
  onOpenBook,
}: {
  books: readonly Book[];
  onOpenBook: (bookId: string) => void;
}): ReactElement {
  return (
    <View style={styles.grid} testID="shelf-book-grid">
      {books.map((book) => (
        <Pressable key={book.id} onPress={() => onOpenBook(book.id)} style={styles.gridItem}>
          <BookCover book={book} showAuthor={false} size="md" />
        </Pressable>
      ))}
    </View>
  );
}

function ListView({
  books,
  onOpenBook,
}: {
  books: readonly Book[];
  onOpenBook: (bookId: string) => void;
}): ReactElement {
  return (
    <View style={styles.list}>
      {books.map((book) => (
        <Pressable key={book.id} onPress={() => onOpenBook(book.id)}>
          <Card style={styles.listRow}>
            <BookCover book={book} showAuthor={false} size="sm" />
            <View style={styles.listMeta}>
              <Text variant="bodyStrong">{book.title}</Text>
              <Text tone="muted">{book.author}</Text>
              <Text tone="accent" variant="caption">
                {book.progress !== undefined ? `${book.progress}%` : "not yet"}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

type SpineSort = (typeof spineSorts)[number];

function SpineView({
  books,
  onOpenBook,
}: {
  books: readonly Book[];
  onOpenBook: (bookId: string) => void;
}): ReactElement {
  const [sort, setSort] = useState<SpineSort>("year");
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>(books[0]?.id);
  const sortedBooks = useMemo(() => sortBooksForSpine(books, sort), [books, sort]);
  const selectedBook = sortedBooks.find((book) => book.id === selectedBookId) ?? sortedBooks[0];

  return (
    <View style={styles.spineWrap}>
      <View style={styles.sortRow}>
        {spineSorts.map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option}
            onPress={() => setSort(option)}
            style={[styles.sortChip, option === sort ? styles.sortChipActive : undefined]}
          >
            <Text tone={option === sort ? "button" : "default"} variant="caption">
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.spineShelf}>
          {sortedBooks.map((book, index) => {
            const selected = book.id === selectedBook?.id;

            return (
              <BookSpine
                book={book}
                index={index}
                key={book.id}
                onPress={setSelectedBookId}
                selected={selected}
              />
            );
          })}
        </View>
      </ScrollView>

      {selectedBook ? (
        <Card style={styles.selectedCard} variant="ink">
          <View style={styles.selectedHeader}>
            <View
              style={[styles.selectedSwatch, { backgroundColor: selectedBook.palette.spine }]}
            />
            <View style={styles.selectedCopy}>
              <Text tone="muted" variant="eyebrow">
                pulled from shelf
              </Text>
              <Text variant="sectionTitle">{selectedBook.title}</Text>
              <Text tone="muted">{selectedBook.author}</Text>
            </View>
          </View>
          <View style={styles.selectedFacts}>
            <View style={styles.factChip}>
              <Text variant="caption">
                {selectedBook.progress !== undefined
                  ? `${selectedBook.progress}% read`
                  : selectedBook.status}
              </Text>
            </View>
          </View>
          <Button
            label="open book"
            onPress={() => onOpenBook(selectedBook.id)}
            variant="secondary"
          />
        </Card>
      ) : null}
    </View>
  );
}

const sortBooksForSpine = (books: readonly Book[], sort: SpineSort): Book[] =>
  [...books].sort((left, right) => {
    if (sort === "year") {
      return right.year.localeCompare(left.year) || left.title.localeCompare(right.title);
    }

    if (sort === "color") {
      return (
        left.palette.spine.localeCompare(right.palette.spine) ||
        left.title.localeCompare(right.title)
      );
    }

    if (sort === "genre") {
      return (
        (left.genre ?? "").localeCompare(right.genre ?? "") || left.title.localeCompare(right.title)
      );
    }

    return left.author.localeCompare(right.author) || left.title.localeCompare(right.title);
  });

const noop = (): void => undefined;
const noopAsync = async (): Promise<void> => undefined;
const noopExistingBook = async (_bookId: string): Promise<void> => undefined;
const noopOpenBook = (_bookId: string): void => undefined;
const noopUpdateShelf = async (_input: UpdateShelfInput): Promise<void> => undefined;
const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === "object" &&
  value !== null &&
  "then" in value &&
  typeof value.then === "function";

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[3],
  },
  availableCopy: {
    flex: 1,
    gap: tokens.space[1],
  },
  availableList: {
    gap: tokens.space[3],
  },
  availableRow: {
    alignItems: "center",
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: tokens.space[3],
    padding: tokens.space[3],
  },
  availableSwatch: {
    borderRadius: tokens.radius.sm,
    height: 36,
    width: 12,
  },
  field: {
    gap: tokens.space[2],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[4],
    justifyContent: "flex-start",
  },
  gridItem: {
    width: 96,
  },
  input: {
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.color.ink,
    fontFamily: tokens.typography.body.fontFamily,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[3],
  },
  list: {
    gap: tokens.space[3],
  },
  listMeta: {
    flex: 1,
    gap: tokens.space[1],
  },
  listRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[4],
  },
  managementCard: {
    gap: tokens.space[4],
  },
  membershipCard: {
    gap: tokens.space[3],
  },
  membershipList: {
    gap: tokens.space[2],
  },
  membershipRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[3],
    paddingVertical: tokens.space[1],
  },
  multilineInput: {
    minHeight: 82,
    textAlignVertical: "top",
  },
  factChip: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  sortChip: {
    backgroundColor: tokens.color.surfaceMuted,
    borderRadius: tokens.radius.pill,
    borderColor: tokens.color.border,
    borderWidth: 1,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  sortChipActive: {
    backgroundColor: tokens.color.accent,
    borderColor: tokens.color.accent,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[2],
  },
  spineShelf: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: tokens.space[2],
    paddingRight: tokens.space[5],
    paddingTop: tokens.space[3],
  },
  spineWrap: {
    gap: tokens.space[4],
  },
  selectedCard: {
    gap: tokens.space[3],
  },
  selectedCopy: {
    flex: 1,
    gap: tokens.space[1],
  },
  selectedFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[2],
  },
  selectedHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[3],
  },
  selectedSwatch: {
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    height: 58,
    width: 18,
  },
});
