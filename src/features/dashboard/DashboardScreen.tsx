import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";

import type { Book, BookStatus } from "../books/types";
import { bookStatusOptions } from "../books/book-status";
import { figmaBooks } from "./fixtures";
import { buildDashboardData } from "./services/stats-service";
import type { DashboardData } from "./types";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { EmptyState } from "../../ui/EmptyState";
import { IconButton } from "../../ui/IconButton";
import { Screen } from "../../ui/Screen";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { StatTile } from "../../ui/StatTile";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface DashboardScreenProps {
  data?: DashboardData | undefined;
  loading?: boolean;
  onAddBook?: () => void;
  onOpenCapture?: () => void;
  onOpenNotifications?: () => void;
  onOpenBook?: (bookId: string) => void;
}

/** Home dashboard for screenshot parity, backed by local SQLite when data is provided. */
export function DashboardScreen({
  data,
  loading = false,
  onAddBook = noop,
  onOpenCapture = noop,
  onOpenNotifications = noop,
  onOpenBook = noopOpenBook
}: DashboardScreenProps): ReactElement {
  const [activeTab, setActiveTab] = useState<BookStatus>("reading");
  const fallbackData = buildDashboardData(figmaBooks.map(mapFixtureBook));
  const dashboard = data ?? fallbackData;
  const filteredBooks = dashboard.books.filter((book) => book.status === activeTab);
  const visibleBooks = (filteredBooks.length > 0 ? filteredBooks : dashboard.activeBooks).slice(0, 6);

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <Text tone="muted" variant="caption">
            inki
          </Text>
          <Text variant="screenTitle">inki</Text>
        </View>
        <View style={styles.topActions}>
          <IconButton label="Open capture" name="camera" onPress={onOpenCapture} />
          <IconButton label="Open notifications" name="bell" onPress={onOpenNotifications} />
          <Button label="Add Book" loading={loading} onPress={onAddBook} />
        </View>
      </View>

      <View style={styles.filterRow}>
        <SegmentedControl
          onValueChange={setActiveTab}
          options={bookStatusOptions}
          value={activeTab}
        />
        <Text tone="muted" variant="caption">
          {dashboard.books.length} / 47
        </Text>
      </View>

      <View style={styles.stackSection}>
        <View style={styles.sectionHeader}>
          <Text variant="hero">The Stack</Text>
          <Text tone="muted" variant="eyebrow">
            {visibleBooks.length} ACTIVE
          </Text>
        </View>

        {visibleBooks.length > 0 ? (
          <View style={styles.bookGrid}>
            {visibleBooks.map((book) => (
              <StackBook key={book.id} book={book} onOpenBook={onOpenBook} />
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
      <ContinuityCard />

      <View style={styles.velocityHeader}>
        <Text variant="hero">Velocity</Text>
        <Text tone="muted" variant="eyebrow">90 DAY ROLLING</Text>
      </View>
      <View style={styles.statGrid}>
        <StatTile detail="+12%" label="pages / min" value="1.4" />
        {dashboard.yearlyStats.map((stat) => (
          <StatTile detail={stat.detail} key={stat.detail} label={stat.label} value={stat.value} />
        ))}
        <StatTile detail="total bookmarks" label="bookmarks" value="142" />
      </View>

      <Card style={styles.postReadCard} variant="ink">
        <Text tone="muted" variant="eyebrow">POST-READ · 12 MAR 2026</Text>
        <Text variant="sectionTitle">What stayed with you?</Text>
        <Text style={styles.quoteText}>
          {"\"The house was not the labyrinth. The labyrinth was the kindness.\""}
        </Text>
        <View style={styles.postReadBook}>
          <View style={styles.postReadCover} />
          <View style={styles.postReadCopy}>
            <Text variant="caption">Piranesi</Text>
            <Text tone="muted" variant="caption">Susanna Clarke</Text>
          </View>
          <Text tone="accent" variant="caption">inki</Text>
        </View>
      </Card>

      <View style={styles.localFooter}>
        <Text tone="muted">
          No feeds. No followers.
        </Text>
        <Text tone="muted">
          Just you, your books, and the data you leave behind.
        </Text>
      </View>
    </Screen>
  );
}

const noop = (): void => undefined;
const noopOpenBook = (_bookId: string): void => undefined;

const mapFixtureBook = (book: (typeof figmaBooks)[number]): Book => ({
  author: book.author,
  currentPage: book.progress ?? 0,
  genre: book.genre,
  id: book.id,
  isChangedYou: false,
  palette: book.palette,
  progress: book.progress,
  status: book.status,
  title: book.title,
  totalPages: totalPagesByBookId[book.id],
  year: book.year
});

function StackBook({ book, onOpenBook }: { book: Book; onOpenBook: (bookId: string) => void }): ReactElement {
  const progress = book.progress ?? progressFromPages(book);
  const pages = getBookPages(book);

  return (
    <Pressable
      accessibilityLabel={`Open ${book.title}`}
      accessibilityRole="button"
      onPress={() => onOpenBook(book.id)}
      style={styles.bookTile}
    >
      <View style={[styles.bookCover, { backgroundColor: book.palette.cover }]}>
        <Text numberOfLines={2} style={styles.bookTitle} tone="inverse" variant="caption">
          {book.title}
        </Text>
        <Text numberOfLines={2} style={styles.bookAuthor} tone="inverse" variant="eyebrow">
          {book.author}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(3, progress)}%` }]} />
      </View>
      <View style={styles.pageRow}>
        <Text tone="accent" variant="caption">{pages}</Text>
        <Text tone="muted" variant="caption">{progress}%</Text>
      </View>
    </Pressable>
  );
}

function PulseCard(): ReactElement {
  return (
    <Card style={styles.pulseCard} variant="elevated">
      <Text variant="sectionTitle">The Pulse</Text>
      <Text tone="muted">Last 16 weeks · reading consistency</Text>
      <View style={styles.heatmap}>{heatmapLevels.map((level, index) => <HeatCell index={index} key={`cell-${index}`} level={level} />)}</View>
      <View style={styles.pulseLegend}>
        <Text tone="muted" variant="caption">less</Text>
        {heatLevels.map((level) => <View key={level} style={[styles.legendCell, heatCellStyles[level]]} />)}
        <Text tone="muted" variant="caption">more</Text>
        <View style={styles.legendSpacer} />
        <Text tone="accent" variant="caption">84</Text>
        <Text tone="muted" variant="caption">/ 112 days</Text>
      </View>
      <View style={styles.bookmarkCard}>
        <View style={styles.bookmarkMark}>
          <Feather color={tokens.color.accent} name="bookmark" size={20} />
        </View>
        <View>
          <Text tone="muted" variant="eyebrow">BOOKMARKS THIS WEEK</Text>
          <Text><Text tone="accent" variant="sectionTitle">3</Text> · 7 day streak</Text>
        </View>
      </View>
    </Card>
  );
}

function HeatCell({ index, level }: { index: number; level: HeatLevel }): ReactElement {
  return <View style={[styles.heatCell, heatCellStyles[level], index % 7 === 6 ? styles.heatCellBreak : undefined]} />;
}

function ContinuityCard(): ReactElement {
  return (
    <Card style={styles.continuityCard} variant="elevated">
      <View style={styles.ring}><Text tone="accent" variant="sectionTitle">78</Text><Text tone="muted" variant="caption">/ 100</Text></View>
      <View style={styles.continuityCopy}>
        <Text variant="sectionTitle">Continuity</Text>
        <Text tone="muted">{"You're reading steadily. A long game, well played."}</Text>
        <View style={styles.continuityMeta}>
          <Text tone="accent" variant="caption">42</Text>
          <Text tone="muted" variant="caption">pg today</Text>
          <Text tone="accent" variant="caption">50</Text>
          <Text tone="muted" variant="caption">goal</Text>
        </View>
      </View>
    </Card>
  );
}

const progressFromPages = (book: Book): number => {
  if (!book.totalPages || book.totalPages <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
};

const getBookPages = (book: Book): string => {
  const totalPages = book.totalPages ?? totalPagesByBookId[book.id];

  if (!totalPages) {
    return book.progress === undefined ? "not yet" : `${book.progress}%`;
  }

  const currentPage = book.currentPage > 0 ? book.currentPage : Math.round((totalPages * (book.progress ?? 0)) / 100);

  return `${currentPage}/${totalPages}`;
};

const totalPagesByBookId: Record<string, number> = {
  bewilderment: 278,
  crossroads: 580,
  klara: 303,
  overstory: 502,
  piranesi: 248,
  tomb: 739
};

type HeatLevel = 0 | 1 | 2 | 3 | 4;

const heatLevels: readonly HeatLevel[] = [0, 1, 2, 3, 4];

const heatmapLevels: HeatLevel[] = Array.from({ length: 112 }, (_, index) => {
  if (index % 11 === 0 || index % 13 === 0) {
    return 0;
  }

  return ((index * 7) % 5) as 0 | 1 | 2 | 3 | 4;
});

const heatCellStyles: Record<HeatLevel, ViewStyle> = {
  0: { backgroundColor: "#181818" },
  1: { backgroundColor: "#334153" },
  2: { backgroundColor: "#51647B" },
  3: { backgroundColor: "#7691B2" },
  4: { backgroundColor: tokens.color.accent }
};

const styles = StyleSheet.create({
  bookmarkCard: {
    alignItems: "center",
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: tokens.space[3],
    padding: tokens.space[4]
  },
  bookmarkMark: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  bookAuthor: {
    opacity: 0.72,
    textTransform: "uppercase"
  },
  bookCover: {
    aspectRatio: 0.67,
    borderRadius: tokens.radius.sm,
    justifyContent: "space-between",
    minHeight: 150,
    padding: tokens.space[3]
  },
  bookGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[3]
  },
  bookTile: {
    flexBasis: "30.8%",
    flexGrow: 1,
    gap: tokens.space[2],
    maxWidth: "31.6%"
  },
  bookTitle: {
    textTransform: "none"
  },
  brandLockup: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[3]
  },
  continuityCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[5]
  },
  continuityCopy: {
    flex: 1,
    gap: tokens.space[2]
  },
  continuityMeta: {
    flexDirection: "row",
    gap: tokens.space[2]
  },
  filterRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heatCell: {
    borderRadius: 2,
    height: 15,
    width: 15
  },
  heatCellBreak: {
    marginRight: tokens.space[1]
  },
  heatmap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    maxWidth: 330
  },
  legendCell: {
    borderRadius: 2,
    height: 12,
    width: 12
  },
  legendSpacer: {
    flex: 1
  },
  localFooter: {
    alignItems: "center",
    gap: tokens.space[2],
    paddingVertical: tokens.space[5]
  },
  pageRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  postReadBook: {
    alignItems: "center",
    borderTopColor: tokens.color.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: tokens.space[3],
    paddingTop: tokens.space[4]
  },
  postReadCard: {
    gap: tokens.space[3]
  },
  postReadCopy: {
    flex: 1
  },
  postReadCover: {
    backgroundColor: "#3A4A5B",
    borderRadius: tokens.radius.xs,
    height: 42,
    width: 32
  },
  progressFill: {
    backgroundColor: tokens.color.accent,
    borderRadius: tokens.radius.pill,
    height: 3
  },
  progressTrack: {
    backgroundColor: tokens.color.border,
    borderRadius: tokens.radius.pill,
    height: 3,
    overflow: "hidden"
  },
  pulseCard: {
    gap: tokens.space[4]
  },
  pulseLegend: {
    alignItems: "center",
    borderTopColor: tokens.color.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: tokens.space[2],
    paddingTop: tokens.space[4]
  },
  quoteText: {
    borderLeftColor: tokens.color.accent,
    borderLeftWidth: 2,
    fontSize: 17,
    lineHeight: 28,
    paddingLeft: tokens.space[3]
  },
  ring: {
    alignItems: "center",
    borderColor: tokens.color.accent,
    borderLeftColor: tokens.color.border,
    borderRadius: 46,
    borderWidth: 4,
    height: 92,
    justifyContent: "center",
    width: 92
  },
  screenContent: {
    paddingBottom: tokens.space[12]
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  stackCard: {
    gap: tokens.space[4]
  },
  stackSection: {
    gap: tokens.space[4]
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[3]
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  topActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[2]
  },
  velocityHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
