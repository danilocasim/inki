import type { ReactElement } from "react";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { BookCover } from "../books/BookCover";
import { figmaBooks, figmaDashboard, getBookById, type BookStatus } from "./fixtures";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Screen } from "../../ui/Screen";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { StatTile } from "../../ui/StatTile";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

/** Home dashboard shell for Figma frame 1:2 and its two variants. */
export function DashboardScreen(): ReactElement {
  const [activeTab, setActiveTab] = useState<BookStatus>("reading");
  const stackBooks = figmaDashboard.stackBookIds.map(getBookById);
  const filteredBooks = figmaBooks.filter((book) => book.status === activeTab);
  const visibleBooks = filteredBooks.length > 0 ? filteredBooks : stackBooks;

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.topBar}>
        <View>
          <Text tone="muted" variant="eyebrow">
            offline library
          </Text>
          <Text variant="screenTitle">inki</Text>
        </View>
        <Button label="Add Book" onPress={noop} />
      </View>

      <SegmentedControl
        onValueChange={setActiveTab}
        options={figmaDashboard.tabs}
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.coverRow}>
            {visibleBooks.map((book) => (
              <BookCover book={book} key={book.id} />
            ))}
          </View>
        </ScrollView>
      </Card>

      <View style={styles.statRow}>
        {figmaDashboard.stats.map((stat) => (
          <StatTile detail={stat.detail} key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </View>

      <Card variant="ink">
        <Text tone="inverse" variant="eyebrow">
          The Pulse
        </Text>
        <View style={styles.pulseList}>
          {figmaDashboard.pulseItems.map((item) => (
            <View key={item} style={styles.pulseItem}>
              <View style={styles.pulseDot} />
              <Text tone="inverse">{item}</Text>
            </View>
          ))}
        </View>
      </Card>

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
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
