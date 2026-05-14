import type { ReactElement } from "react";
import { useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutRectangle,
} from "react-native";

import type { Book, BookStatus } from "../books/types";
import { bookStatusOptions } from "../books/book-status";
import { LongPressMenu, type LongPressColumn } from "./components/LongPressMenu";
import { orderBooksForStack } from "./services/stack-order";
import { buildDashboardData } from "./services/stats-service";
import type { DashboardData } from "./types";
import { Card } from "../../ui/Card";
import { EmptyState } from "../../ui/EmptyState";
import { IconButton } from "../../ui/IconButton";
import { Screen } from "../../ui/Screen";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { StatTile } from "../../ui/StatTile";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

const pulseMinImg = require("../../assets/heatmap/pulse_min.png");
const pulseMaxImg = require("../../assets/heatmap/pulse_max.png");

export interface DashboardScreenProps {
  data?: DashboardData | undefined;
  loading?: boolean;
  onAddBook?: () => void;
  onOpenNotifications?: () => void;
  onOpenBook?: (bookId: string) => void;
  onPinBook?: (book: Book) => void;
  onShareBook?: (book: Book) => void;
  onShelveBook?: (book: Book) => void;
}

interface ActiveLongPress {
  book: Book;
  column: LongPressColumn;
  rect: LayoutRectangle;
}

/** Home dashboard for screenshot parity, backed by local SQLite when data is provided. */
export function DashboardScreen({
  data,
  loading = false,
  onAddBook = noop,
  onOpenNotifications = noop,
  onOpenBook = noopOpenBook,
  onPinBook = noopBook,
  onShareBook = noopBook,
  onShelveBook = noopBook,
}: DashboardScreenProps): ReactElement {
  const [activeTab, setActiveTab] = useState<BookStatus>("reading");
  const [activeLongPress, setActiveLongPress] = useState<ActiveLongPress | null>(null);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const dashboard = data ?? emptyDashboardData;
  const filteredBooks = dashboard.books.filter((book) => book.status === activeTab);
  const visibleBooks = orderBooksForStack(filteredBooks).slice(0, 6);
  const hasBooks = dashboard.books.length > 0;

  const beginLongPress = (book: Book, rect: LayoutRectangle, column: LongPressColumn): void => {
    if (activeLongPress) return;
    setActiveLongPress({ book, column, rect });
  };

  const endLongPress = (): void => setActiveLongPress(null);

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <Text variant="sectionTitle">inki</Text>
          <Text tone="muted" variant="caption">
            local library
          </Text>
        </View>
        <View style={styles.topActions}>
          <IconButton
            label="Open notifications"
            name="bell"
            onPress={onOpenNotifications}
            size={18}
          />
          <IconButton
            disabled={loading}
            label="Add Book"
            name="plus"
            onPress={onAddBook}
            size={18}
            variant="accent"
          />
        </View>
      </View>

      <View style={styles.filterRow} testID="dashboard-filter-row">
        <SegmentedControl
          onValueChange={setActiveTab}
          options={bookStatusOptions}
          value={activeTab}
        />
        <Text
          tone="muted"
          style={styles.filterCount}
          testID="dashboard-filter-summary"
          variant="caption"
        >
          {`${visibleBooks.length} shown · ${dashboard.books.length} total`}
        </Text>
      </View>

      <View style={styles.stackSection}>
        <View style={styles.sectionHeader} testID="dashboard-stack-header">
          <Text numberOfLines={1} style={styles.stackTitle} variant="hero">
            The Stack
          </Text>
          <Text tone="muted" style={styles.stackCount} variant="eyebrow">
            {visibleBooks.length} ACTIVE
          </Text>
        </View>

        {visibleBooks.length > 0 ? (
          <View style={styles.bookGrid} testID="dashboard-book-grid">
            {visibleBooks.map((book, index) => (
              <StackBook
                book={book}
                key={book.id}
                onLongPress={(rect) => beginLongPress(book, rect, (index % 3) as LongPressColumn)}
                onOpenBook={onOpenBook}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            actionLabel="Add Book"
            message="Your local library is empty. Add a book manually; no account required."
            onAction={onAddBook}
            title="Start your stack"
          />
        )}
      </View>

      <PulseCard />

      {hasBooks ? (
        <>
          <View style={styles.velocityHeader}>
            <Text variant="hero">Your year</Text>
            <Text tone="muted" variant="eyebrow">
              FROM YOUR LIBRARY
            </Text>
          </View>
          <View style={styles.statGrid}>
            {dashboard.yearlyStats.map((stat) => (
              <StatTile
                detail={stat.detail}
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.localFooter}>
        <Text tone="muted">No feeds. No followers.</Text>
        <Text tone="muted">Just you, your books, and the data you leave behind.</Text>
      </View>

      {activeLongPress ? (
        <LongPressMenu
          book={activeLongPress.book}
          column={activeLongPress.column}
          onDismiss={endLongPress}
          onPin={() => onPinBook(activeLongPress.book)}
          onShare={() => onShareBook(activeLongPress.book)}
          onShelf={() => onShelveBook(activeLongPress.book)}
          screenHeight={windowHeight}
          screenWidth={windowWidth}
          tileRect={activeLongPress.rect}
        />
      ) : null}
    </Screen>
  );
}

const noop = (): void => undefined;
const noopBook = (_book: Book): void => undefined;
const noopOpenBook = (_bookId: string): void => undefined;
const emptyDashboardData: DashboardData = buildDashboardData([]);

function StackBook({
  book,
  onLongPress,
  onOpenBook,
}: {
  book: Book;
  onLongPress: (rect: LayoutRectangle) => void;
  onOpenBook: (bookId: string) => void;
}): ReactElement {
  const progress = book.progress ?? progressFromPages(book);
  const pages = getBookPages(book);
  const coverRef = useRef<View>(null);

  const handleLongPress = (): void => {
    coverRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress({ height, width, x, y });
    });
  };

  return (
    <Pressable
      accessibilityActions={[{ label: "Book options", name: "Book options" }]}
      accessibilityLabel={`Open ${book.title}`}
      accessibilityRole="button"
      delayLongPress={400}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "Book options") {
          handleLongPress();
        }
      }}
      onLongPress={handleLongPress}
      onPress={() => onOpenBook(book.id)}
      style={styles.bookTile}
    >
      <View ref={coverRef} style={[styles.bookCover, { backgroundColor: book.palette.cover }]}>
        {book.coverPath ? (
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            source={{ uri: book.coverPath }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <>
            <Text numberOfLines={2} style={styles.bookTitle} tone="inverse" variant="caption">
              {book.title}
            </Text>
            <Text numberOfLines={2} style={styles.bookAuthor} tone="inverse" variant="eyebrow">
              {book.author}
            </Text>
          </>
        )}
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(3, progress)}%` }]} />
      </View>
      <View style={styles.pageRow}>
        <Text tone="accent" variant="caption">
          {pages}
        </Text>
        <Text tone="muted" variant="caption">
          {progress}%
        </Text>
      </View>
    </Pressable>
  );
}

function PulseCard(): ReactElement {
  return (
    <Card style={styles.pulseCard} variant="elevated">
      <View style={styles.pulseHeader}>
        <View style={styles.pulseTitleGroup}>
          <Text variant="sectionTitle">The Pulse</Text>
          <Text tone="muted">This month · reading consistency</Text>
        </View>
      </View>
      <View style={styles.heatmapGrid}>
        {heatmapRows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.heatmapRow}>
            {row.map((level, colIndex) => (
              <HeatCell key={`cell-${rowIndex}-${colIndex}`} level={level} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.pulseLegend}>
        <Text tone="muted" variant="caption">
          less
        </Text>
        {heatLevels.map((level) => {
          const source = cellImage(level);
          return source === undefined ? (
            <View key={level} style={styles.legendCell} />
          ) : (
            <Image
              accessibilityIgnoresInvertColors
              key={level}
              resizeMode="cover"
              source={source}
              style={styles.legendCell}
            />
          );
        })}
        <Text tone="muted" variant="caption">
          more
        </Text>
      </View>
    </Card>
  );
}

function HeatCell({ level }: { level: HeatLevel }): ReactElement {
  const source = cellImage(level);
  if (source === undefined) {
    return <View style={styles.heatCell} />;
  }
  return (
    <Image
      accessibilityIgnoresInvertColors
      resizeMode="cover"
      source={source}
      style={styles.heatCell}
    />
  );
}

const cellImage = (level: HeatLevel) => {
  if (level === 0) return undefined;
  if (level <= 2) return pulseMinImg;
  return pulseMaxImg;
};

const progressFromPages = (book: Book): number => {
  if (!book.totalPages || book.totalPages <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
};

const getBookPages = (book: Book): string => {
  if (!book.totalPages) {
    return book.progress === undefined ? "not yet" : `${book.progress}%`;
  }

  return `${book.currentPage}/${book.totalPages}`;
};

type HeatLevel = 0 | 1 | 2 | 3 | 4;

const heatLevels: readonly HeatLevel[] = [0, 1, 3];

const HEATMAP_ROWS = 3;
const HEATMAP_COLS = 10;

const deriveLevel = (index: number): HeatLevel => {
  if (index % 11 === 0 || index % 13 === 0) {
    return 0;
  }
  return ((index * 7) % 5) as HeatLevel;
};

const buildHeatmapRows = (): HeatLevel[][] =>
  Array.from({ length: HEATMAP_ROWS }, (_, rowIndex) =>
    Array.from({ length: HEATMAP_COLS }, (_, colIndex) =>
      deriveLevel(rowIndex * HEATMAP_COLS + colIndex + 1),
    ),
  );

const heatmapRows = buildHeatmapRows();

const styles = StyleSheet.create({
  bookAuthor: {
    opacity: 0.72,
    textTransform: "uppercase",
  },
  bookCover: {
    aspectRatio: 0.67,
    borderRadius: tokens.radius.sm,
    justifyContent: "space-between",
    minHeight: 150,
    overflow: "hidden",
    padding: tokens.space[3],
  },
  bookGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[3],
    justifyContent: "flex-start",
  },
  bookTile: {
    flexBasis: "30.8%",
    gap: tokens.space[2],
    width: "30.8%",
  },
  bookTitle: {
    textTransform: "none",
  },
  brandLockup: {
    gap: 2,
  },
  filterRow: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: tokens.space[2],
  },
  filterCount: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  heatCell: {
    borderColor: tokens.color.white,
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: undefined,
    aspectRatio: 1,
  },
  heatmapGrid: {
    alignSelf: "stretch",
    gap: 5,
  },
  heatmapRow: {
    flexDirection: "row",
    gap: 5,
  },
  legendCell: {
    borderColor: tokens.color.white,
    borderRadius: 3,
    borderWidth: 1,
    height: 16,
    width: 16,
  },
  localFooter: {
    alignItems: "center",
    gap: tokens.space[2],
    paddingVertical: tokens.space[5],
  },
  pageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressFill: {
    backgroundColor: tokens.color.accent,
    borderRadius: tokens.radius.pill,
    height: 3,
  },
  progressTrack: {
    backgroundColor: tokens.color.border,
    borderRadius: tokens.radius.pill,
    height: 3,
    overflow: "hidden",
  },
  pulseCard: {
    gap: tokens.space[4],
  },
  pulseHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: tokens.space[3],
    justifyContent: "space-between",
  },
  pulseLegend: {
    alignItems: "center",
    borderTopColor: tokens.color.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: tokens.space[2],
    paddingTop: tokens.space[4],
  },
  pulseTitleGroup: {
    flex: 1,
    gap: tokens.space[1],
  },
  screenContent: {
    paddingBottom: tokens.space[12],
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: tokens.space[1],
  },
  stackCard: {
    gap: tokens.space[4],
  },
  stackSection: {
    gap: tokens.space[4],
  },
  stackCount: {
    alignSelf: "flex-end",
  },
  stackTitle: {
    maxWidth: "100%",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[3],
  },
  topBar: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: tokens.space[3],
    justifyContent: "space-between",
  },
  topActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[1],
  },
  velocityHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
