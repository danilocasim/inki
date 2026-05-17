import type { ReactElement } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutRectangle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import type { Book, BookStatus } from "../books/types";
import { bookStatusOptions } from "../books/book-status";
import {
  computeColumnActionLayout,
  hitTestAction,
  LongPressMenu,
  type LongPressActionKey,
  type LongPressColumn,
} from "./components/LongPressMenu";
import { PulseMenu } from "./components/PulseMenu";
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
  onSharePulse?: () => void;
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
  onSharePulse = noop,
  onShelveBook = noopBook,
}: DashboardScreenProps): ReactElement {
  const [activeTab, setActiveTab] = useState<BookStatus>("reading");
  const [activeLongPress, setActiveLongPress] = useState<ActiveLongPress | null>(null);
  const [hoveredAction, setHoveredAction] = useState<LongPressActionKey | null>(null);
  const activeLongPressRef = useRef<ActiveLongPress | null>(null);
  const hoveredActionRef = useRef<LongPressActionKey | null>(null);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const dashboard = data ?? emptyDashboardData;
  const filteredBooks = dashboard.books.filter((book) => book.status === activeTab);
  const visibleBooks = orderBooksForStack(filteredBooks).slice(0, 6);
  const hasBooks = dashboard.books.length > 0;

  const clearLongPress = (): void => {
    activeLongPressRef.current = null;
    hoveredActionRef.current = null;
    setActiveLongPress(null);
    setHoveredAction(null);
  };

  const beginLongPress = (book: Book, rect: LayoutRectangle, column: LongPressColumn): void => {
    if (activeLongPressRef.current) return;
    const next: ActiveLongPress = { book, column, rect };
    activeLongPressRef.current = next;
    hoveredActionRef.current = null;
    setActiveLongPress(next);
    setHoveredAction(null);
  };

  // Called continuously while the finger slides after a long-press.
  const moveLongPress = (absoluteX: number, absoluteY: number): void => {
    const active = activeLongPressRef.current;
    if (!active) return;

    const layout = computeColumnActionLayout(active.rect, windowWidth, windowHeight, active.column);
    const next = hitTestAction(layout, absoluteX, absoluteY);

    if (next !== hoveredActionRef.current) {
      hoveredActionRef.current = next;
      setHoveredAction(next);
      if (next) {
        // Crisp tick each time the finger crosses onto a new action.
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }
    }
  };

  // Called when the finger lifts. Fires the hovered action, if any.
  const finishLongPress = (): void => {
    const active = activeLongPressRef.current;
    const hovered = hoveredActionRef.current;
    if (!active) return;

    if (hovered === null) {
      // Released without a target — keep the menu open for tap interaction.
      return;
    }

    // Satisfying commit thump when an action is selected by release.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);

    if (hovered === "pin") {
      onPinBook(active.book);
    } else if (hovered === "share") {
      onShareBook(active.book);
    } else {
      onShelveBook(active.book);
    }

    clearLongPress();
  };

  return (
    <Screen contentStyle={styles.screenContent} scrollEnabled={activeLongPress === null}>
      <View style={styles.topBar}>
        <View style={styles.brandLockup}>
          <Text variant="screenTitle">inki</Text>
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

      <View style={styles.headerDivider} />

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
                onLongPressEnd={finishLongPress}
                onLongPressMove={moveLongPress}
                onLongPressStart={(rect) =>
                  beginLongPress(book, rect, (index % 3) as LongPressColumn)
                }
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

      <PulseCard onShare={onSharePulse} pulseDays={dashboard.pulseDays} />

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
          hoveredAction={hoveredAction}
          onDismiss={clearLongPress}
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

const LONG_PRESS_MS = 400;

function StackBook({
  book,
  onLongPressEnd,
  onLongPressMove,
  onLongPressStart,
  onOpenBook,
}: {
  book: Book;
  onLongPressEnd: () => void;
  onLongPressMove: (absoluteX: number, absoluteY: number) => void;
  onLongPressStart: (rect: LayoutRectangle) => void;
  onOpenBook: (bookId: string) => void;
}): ReactElement {
  const progress = book.progress ?? progressFromPages(book);
  const pages = getBookPages(book);
  const coverRef = useRef<View>(null);

  // Keep the latest callbacks in refs so the memoised gesture never goes stale.
  const startRef = useRef(onLongPressStart);
  const moveRef = useRef(onLongPressMove);
  const endRef = useRef(onLongPressEnd);
  const openRef = useRef(onOpenBook);
  startRef.current = onLongPressStart;
  moveRef.current = onLongPressMove;
  endRef.current = onLongPressEnd;
  openRef.current = onOpenBook;

  const measureAndStart = useCallback((): void => {
    coverRef.current?.measureInWindow((x, y, width, height) => {
      startRef.current({ height, width, x, y });
    });
  }, []);

  const reportMove = useCallback((x: number, y: number): void => {
    moveRef.current(x, y);
  }, []);

  const reportEnd = useCallback((): void => {
    endRef.current();
  }, []);

  const openBook = useCallback((): void => {
    openRef.current(book.id);
  }, [book.id]);

  const gesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd((_event, success) => {
      if (success) {
        runOnJS(openBook)();
      }
    });

    // Pan that only activates after a long-press hold, then tracks the finger.
    const drag = Gesture.Pan()
      .activateAfterLongPress(LONG_PRESS_MS)
      .onStart(() => {
        runOnJS(measureAndStart)();
      })
      .onUpdate((event) => {
        runOnJS(reportMove)(event.absoluteX, event.absoluteY);
      })
      .onEnd(() => {
        runOnJS(reportEnd)();
      });

    return Gesture.Exclusive(drag, tap);
  }, [measureAndStart, openBook, reportEnd, reportMove]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessibilityActions={[{ label: "Book options", name: "Book options" }]}
        accessibilityLabel={`Open ${book.title}`}
        accessibilityRole="button"
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "Book options") {
            measureAndStart();
          }
        }}
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
      </View>
    </GestureDetector>
  );
}

function PulseCard({
  onShare,
  pulseDays,
}: {
  onShare: () => void;
  pulseDays: readonly number[];
}): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const rows = buildPulseRows(pulseDays);
  const now = new Date();
  const monthLabel = `${MONTH_LABELS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  // Long-press to open the share menu, mirroring the book long-press gesture.
  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(400)
        .onStart(() => {
          runOnJS(setMenuOpen)(true);
        }),
    [],
  );

  return (
    <>
      <GestureDetector gesture={longPress}>
        <View>
          <Card style={styles.pulseCard} variant="elevated">
            <View style={styles.pulseHeader}>
              <View style={styles.pulseTitleGroup}>
                <Text variant="hero">The Pulse</Text>
                <Text tone="muted">{`${monthLabel} · bookmarks saved`}</Text>
              </View>
              <Text style={styles.pulseDayCount} tone="muted" variant="eyebrow">
                {`${pulseDays.length} DAYS`}
              </Text>
            </View>
            <View style={styles.heatmapGrid}>
              {rows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.heatmapRow}>
                  <Text style={styles.heatmapRowLabel} tone="muted" variant="caption">
                    {String(rowIndex * HEATMAP_COLS + 1)}
                  </Text>
                  {row.map((cell, colIndex) =>
                    cell.kind === "spacer" ? (
                      <View key={`spacer-${rowIndex}-${colIndex}`} style={styles.heatSpacer} />
                    ) : (
                      <HeatCell key={`cell-${rowIndex}-${colIndex}`} level={cell.level} />
                    ),
                  )}
                </View>
              ))}
            </View>
            <View style={styles.pulseLegend}>
              <Text tone="muted" variant="caption">
                less
              </Text>
              {heatLevels.map((level) => {
                const source = cellImage(level);
                return (
                  <View key={level} style={styles.legendCell}>
                    {source === undefined ? null : (
                      <Image
                        accessibilityIgnoresInvertColors
                        resizeMode="cover"
                        source={source}
                        style={styles.legendCellImage}
                      />
                    )}
                  </View>
                );
              })}
              <Text tone="muted" variant="caption">
                more
              </Text>
            </View>
          </Card>
        </View>
      </GestureDetector>
      {menuOpen ? (
        <PulseMenu onDismiss={() => setMenuOpen(false)} onShare={onShare} />
      ) : null}
    </>
  );
}

function HeatCell({ level }: { level: HeatLevel }): ReactElement {
  const source = cellImage(level);
  return (
    <View style={styles.heatCell}>
      {source === undefined ? null : (
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={source}
          style={styles.heatCellImage}
        />
      )}
    </View>
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

type PulseCell = { kind: "day"; level: HeatLevel } | { kind: "spacer" };

const heatLevels: readonly HeatLevel[] = [0, 1, 3];

const HEATMAP_COLS = 10;

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Maps a day's saved-bookmark count to a heat level. */
const levelFromCount = (count: number): HeatLevel => {
  if (count <= 0) return 0;
  if (count <= 2) return 2;
  return 4;
};

/**
 * Builds the heatmap grid from the month's per-day bookmark counts — one cell
 * per day. The final row is padded with spacers so every row stays aligned.
 */
const buildPulseRows = (pulseDays: readonly number[]): PulseCell[][] => {
  const cells: PulseCell[] = pulseDays.map((count) => ({
    kind: "day",
    level: levelFromCount(count),
  }));
  const rows: PulseCell[][] = [];

  for (let start = 0; start < cells.length; start += HEATMAP_COLS) {
    const row = cells.slice(start, start + HEATMAP_COLS);
    while (row.length < HEATMAP_COLS) {
      row.push({ kind: "spacer" });
    }
    rows.push(row);
  }

  return rows;
};

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
    flex: 1,
    gap: 2,
  },
  headerDivider: {
    backgroundColor: tokens.color.border,
    height: 1,
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
    alignItems: "center",
    aspectRatio: 1,
    borderColor: tokens.color.white,
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: undefined,
    justifyContent: "center",
    overflow: "hidden",
  },
  heatCellImage: {
    height: "100%",
    width: "100%",
  },
  heatSpacer: {
    flex: 1,
  },
  heatmapGrid: {
    alignSelf: "stretch",
    gap: 5,
  },
  heatmapRow: {
    flexDirection: "row",
    gap: 5,
  },
  heatmapRowLabel: {
    alignSelf: "center",
    textAlign: "right",
    width: 22,
  },
  legendCell: {
    alignItems: "center",
    borderColor: tokens.color.white,
    borderRadius: 3,
    borderWidth: 1,
    height: 16,
    justifyContent: "center",
    overflow: "hidden",
    width: 16,
  },
  legendCellImage: {
    height: "100%",
    width: "100%",
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
  pulseDayCount: {
    alignSelf: "center",
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
    paddingBottom: 112,
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
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[3],
    justifyContent: "space-between",
  },
  topActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[2],
  },
  velocityHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
