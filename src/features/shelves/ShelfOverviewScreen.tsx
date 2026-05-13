import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { figmaShelves, shelfFilters, type BookStatus } from "../dashboard/fixtures";
import type { Shelf } from "./types";
import { Card } from "../../ui/Card";
import { Screen } from "../../ui/Screen";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface ShelfOverviewScreenProps {
  onOpenShelf: (shelfId: string) => void;
  shelves?: readonly Shelf[];
}

/** Shelf overview for screenshots 11-12, backed by local SQLite when provided. */
export function ShelfOverviewScreen({ onOpenShelf, shelves }: ShelfOverviewScreenProps): ReactElement {
  const [filter, setFilter] = useState<BookStatus | "all">("all");
  const visibleShelves = shelves ?? figmaShelves.map((shelf) => ({
    accent: shelf.accent,
    count: shelf.bookIds.length,
    id: shelf.id,
    kind: "custom" as const,
    subtitle: shelf.subtitle,
    title: shelf.title
  }));

  return (
    <Screen subtitle="four local collections, ready offline" title="shelf">
      <SegmentedControl onValueChange={setFilter} options={shelfFilters} value={filter} />

      <View style={styles.sectionHeader}>
        <Text variant="eyebrow">MY SHELVES — {visibleShelves.length}</Text>
        <Text tone="muted" variant="caption">
          {filter}
        </Text>
      </View>

      <View style={styles.shelfList}>
        {visibleShelves.map((shelf) => (
          <Pressable
            accessibilityLabel={`Open ${shelf.title}`}
            accessibilityRole="button"
            key={shelf.id}
            onPress={() => onOpenShelf(shelf.id)}
          >
            <Card style={styles.shelfCard} variant="elevated">
              <View style={[styles.shelfAccent, { backgroundColor: shelf.accent }]} />
              <View style={styles.shelfBody}>
                <Text variant="sectionTitle">{shelf.title}</Text>
                <Text tone="muted">{shelf.subtitle}</Text>
                <Text tone="accent" variant="caption">
                  {shelf.count} books
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Card style={styles.archiveCard} variant="ink">
        <Text tone="inverse" variant="eyebrow">
          ARCHIVE WALL
        </Text>
        <Text tone="inverse" variant="sectionTitle">
          share wall
        </Text>
        <Text tone="inverse">
          A future local export turns your shelf history into a deterministic image.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  archiveCard: {
    gap: tokens.space[2]
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  shelfAccent: {
    alignSelf: "stretch",
    borderRadius: tokens.radius.pill,
    width: 10
  },
  shelfBody: {
    flex: 1,
    gap: tokens.space[2]
  },
  shelfCard: {
    flexDirection: "row",
    gap: tokens.space[4]
  },
  shelfList: {
    gap: tokens.space[3]
  }
});
