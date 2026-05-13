import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { BookCover } from "../books/BookCover";
import type { Book, BookStatus } from "../books/types";
import { bookStatusOptions } from "../books/book-status";
import { figmaBooks } from "./fixtures";
import { buildDashboardData } from "./services/stats-service";
import type { DashboardData } from "./types";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { EmptyState } from "../../ui/EmptyState";
import { Screen } from "../../ui/Screen";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { StatTile } from "../../ui/StatTile";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface DashboardScreenProps {
  data?: DashboardData | undefined;
  loading?: boolean;
  onAddBook?: () => void;
  onOpenBook?: (bookId: string) => void;
}

/** Home dashboard shell for screenshot parity, backed by local SQLite when data is provided. */
export function DashboardScreen({
  data,
  loading = false,
  onAddBook = noop,
  onOpenBook = noopOpenBook
}: DashboardScreenProps): ReactElement {
  const [activeTab, setActiveTab] = useState<BookStatus>("reading");
  const fallbackData = buildDashboardData(figmaBooks.map(mapFixtureBook));
  const dashboard = data ?? fallbackData;
  const filteredBooks = dashboard.books.filter((book) => book.status === activeTab);
  const visibleBooks = filteredBooks.length > 0 ? filteredBooks : dashboard.activeBooks;

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.topBar}>
        <View>
          <Text tone="muted" variant="eyebrow">
            offline library
          </Text>
          <Text variant="screenTitle">inki</Text>
        </View>
        <Button label="Add Book" loading={loading} onPress={onAddBook} />
      </View>

      <SegmentedControl
        onValueChange={setActiveTab}
        options={bookStatusOptions}
        value={activeTab}
      />

      <Card style={styles.stackCard} variant="elevated">
        <View style={styles.sectionHeader}>
          <View>
            <Text tone="muted" variant="eyebrow">
              now reading
            </Text>
            <Text variant="hero">The Stack</Text>
          </View>
          <Text tone="accent" variant="caption">
            {visibleBooks.length} books
          </Text>
        </View>

        {visibleBooks.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.coverRow}>
              {visibleBooks.map((book) => (
                <Pressable
                  accessibilityLabel={`Open ${book.title}`}
                  accessibilityRole="button"
                  key={book.id}
                  onPress={() => onOpenBook(book.id)}
                >
                  <BookCover book={book} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : (
          <EmptyState
            actionLabel="Add Book"
            message="Your local library is empty. Add a book manually; no account required."
            onAction={onAddBook}
            title="Start your stack"
          />
        )}
      </Card>

      <View style={styles.statRow}>
        {dashboard.stats.map((stat) => (
          <StatTile detail={stat.detail} key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </View>

      <Card variant="ink">
        <Text tone="inverse" variant="eyebrow">
          The Pulse
        </Text>
        <View style={styles.pulseList}>
          {dashboard.pulseItems.map((item) => (
            <View key={item} style={styles.pulseItem}>
              <View style={styles.pulseDot} />
              <Text tone="inverse">{item}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.statGrid}>
        {dashboard.yearlyStats.map((stat) => (
          <StatTile detail={stat.detail} key={stat.detail} label={stat.label} value={stat.value} />
        ))}
      </View>

      <Card>
        <Text variant="sectionTitle">post-read prompt</Text>
        <Text tone="muted">
          When you finish a book, Inki will ask what changed, what stayed with you, and
          whether to make a local share card.
        </Text>
      </Card>
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
  year: book.year
});

const styles = StyleSheet.create({
  coverRow: {
    flexDirection: "row",
    gap: tokens.space[4],
    paddingRight: tokens.space[2]
  },
  pulseDot: {
    backgroundColor: tokens.color.gold,
    borderRadius: tokens.radius.pill,
    height: 8,
    marginTop: 7,
    width: 8
  },
  pulseItem: {
    flexDirection: "row",
    gap: tokens.space[3]
  },
  pulseList: {
    gap: tokens.space[3],
    marginTop: tokens.space[3]
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
  statRow: {
    flexDirection: "row",
    gap: tokens.space[3]
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
  }
});
