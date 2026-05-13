import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { BookCover } from "../books/BookCover";
import type { Book } from "../books/types";
import {
  getBookById,
  getShelfById,
  shelfViews,
  spineSorts,
  type ShelfView,
} from "../dashboard/fixtures";
import type { Shelf } from "./types";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { EmptyState } from "../../ui/EmptyState";
import { Screen } from "../../ui/Screen";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface ShelfDetailScreenProps {
  onOpenBook?: (bookId: string) => void;
  onShareShelf?: () => void;
  onViewChange: (view: ShelfView) => void;
  shelf?: Shelf | undefined;
  shelfId: string;
  view: ShelfView;
}

/** Static shelf detail route that switches among grid, list, and spine views. */
export function ShelfDetailScreen({
  onOpenBook = noopOpenBook,
  onShareShelf = noop,
  onViewChange,
  shelf: providedShelf,
  shelfId,
  view,
}: ShelfDetailScreenProps): ReactElement {
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

  return (
    <Screen subtitle={shelf.subtitle} title={shelf.title}>
      <SegmentedControl onValueChange={onViewChange} options={shelfViews} value={view} />
      {renderShelfView(view, books, onOpenBook)}
      <Button label="share shelf" onPress={onShareShelf} />
    </Screen>
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
    <View style={styles.grid}>
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
          {sortedBooks.map((book) => {
            const selected = book.id === selectedBook?.id;

            return (
              <Pressable
                accessibilityLabel={`Select ${book.title}`}
                accessibilityRole="button"
                key={book.id}
                onPress={() => setSelectedBookId(book.id)}
                style={[
                  styles.spineBook,
                  selected ? styles.spineBookSelected : undefined,
                  { backgroundColor: book.palette.spine },
                ]}
              >
                <Text numberOfLines={1} style={styles.spineText} tone="inverse" variant="caption">
                  {book.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {selectedBook ? (
        <Card style={styles.selectedCard}>
          <Text tone="muted" variant="eyebrow">
            selected spine
          </Text>
          <Text variant="sectionTitle">{selectedBook.title}</Text>
          <Text tone="muted">
            {selectedBook.author} · {selectedBook.year} · {selectedBook.genre}
          </Text>
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
const noopOpenBook = (_bookId: string): void => undefined;

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[4],
    justifyContent: "space-between",
  },
  gridItem: {
    width: 96,
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
  spineBook: {
    borderRadius: tokens.radius.sm,
    height: 210,
    justifyContent: "center",
    overflow: "hidden",
    padding: tokens.space[2],
    width: 56,
  },
  spineBookSelected: {
    borderColor: tokens.color.accent,
    borderWidth: 2,
  },
  spineShelf: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: tokens.space[2],
    paddingRight: tokens.space[5],
  },
  spineText: {
    textAlign: "center",
    transform: [{ rotate: "-90deg" }],
    width: 170,
  },
  spineWrap: {
    gap: tokens.space[4],
  },
  selectedCard: {
    gap: tokens.space[3],
  },
});
