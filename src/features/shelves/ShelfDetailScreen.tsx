import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { BookCover } from "../books/BookCover";
import {
  getBookById,
  getShelfById,
  shelfViews,
  spineSorts,
  type FigmaBook,
  type ShelfView
} from "../dashboard/fixtures";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { EmptyState } from "../../ui/EmptyState";
import { Screen } from "../../ui/Screen";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface ShelfDetailScreenProps {
  onViewChange: (view: ShelfView) => void;
  shelfId: string;
  view: ShelfView;
}

/** Static shelf detail route that switches among grid, list, and spine views. */
export function ShelfDetailScreen({
  onViewChange,
  shelfId,
  view
}: ShelfDetailScreenProps): ReactElement {
  const shelf = getShelfById(shelfId);

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

  const books = shelf.bookIds.map(getBookById);

  return (
    <Screen subtitle={shelf.subtitle} title={shelf.title}>
      <SegmentedControl onValueChange={onViewChange} options={shelfViews} value={view} />
      {renderShelfView(view, books)}
      <Button label="share shelf" onPress={noop} />
    </Screen>
  );
}

const renderShelfView = (view: ShelfView, books: readonly FigmaBook[]): ReactElement => {
  switch (view) {
    case "grid":
      return <GridView books={books} />;
    case "list":
      return <ListView books={books} />;
    case "spine":
      return <SpineView books={books} />;
  }
};

function GridView({ books }: { books: readonly FigmaBook[] }): ReactElement {
  return (
    <View style={styles.grid}>
      {books.map((book) => (
        <BookCover book={book} key={book.id} showAuthor={false} size="lg" />
      ))}
    </View>
  );
}

function ListView({ books }: { books: readonly FigmaBook[] }): ReactElement {
  return (
    <View style={styles.list}>
      {books.map((book) => (
        <Card key={book.id} style={styles.listRow}>
          <BookCover book={book} showAuthor={false} size="sm" />
          <View style={styles.listMeta}>
            <Text variant="bodyStrong">{book.title}</Text>
            <Text tone="muted">{book.author}</Text>
            <Text tone="accent" variant="caption">
              {book.progress !== undefined ? `${book.progress}%` : "not yet"}
            </Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

function SpineView({ books }: { books: readonly FigmaBook[] }): ReactElement {
  const selectedBook = books[0];

  return (
    <View style={styles.spineWrap}>
      <View style={styles.sortRow}>
        {spineSorts.map((sort) => (
          <View key={sort} style={styles.sortChip}>
            <Text variant="caption">{sort}</Text>
          </View>
        ))}
      </View>

      <View style={styles.spineShelf}>
        {books.map((book) => (
          <View key={book.id} style={[styles.spineBook, { backgroundColor: book.palette.spine }]}>
            <Text numberOfLines={1} style={styles.spineText} tone="inverse" variant="caption">
              {book.title}
            </Text>
          </View>
        ))}
      </View>

      {selectedBook ? (
        <Card>
          <Text tone="muted" variant="eyebrow">
            selected spine
          </Text>
          <Text variant="sectionTitle">{selectedBook.title}</Text>
          <Text tone="muted">
            {selectedBook.author} · {selectedBook.year} · {selectedBook.genre}
          </Text>
        </Card>
      ) : null}
    </View>
  );
}

const noop = (): void => undefined;

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[4],
    justifyContent: "space-between"
  },
  list: {
    gap: tokens.space[3]
  },
  listMeta: {
    flex: 1,
    gap: tokens.space[1]
  },
  listRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[4]
  },
  sortChip: {
    backgroundColor: tokens.color.surfaceMuted,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2]
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[2]
  },
  spineBook: {
    borderRadius: tokens.radius.sm,
    height: 180,
    justifyContent: "flex-end",
    padding: tokens.space[2],
    width: 42
  },
  spineShelf: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: tokens.space[2]
  },
  spineText: {
    transform: [{ rotate: "-90deg" }],
    width: 150
  },
  spineWrap: {
    gap: tokens.space[4]
  }
});
