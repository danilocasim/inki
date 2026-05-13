import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { figmaShelves, shelfFilters, type BookStatus } from "../dashboard/fixtures";
import { Card } from "../../ui/Card";
import { Screen } from "../../ui/Screen";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface ShelfOverviewScreenProps {
  onOpenShelf: (shelfId: string) => void;
}

/** Static shelf overview for Figma frames 4:2 and 4:129. */
export function ShelfOverviewScreen({ onOpenShelf }: ShelfOverviewScreenProps): ReactElement {
  const [filter, setFilter] = useState<BookStatus | "all">("all");

  return (
    <Screen subtitle="four local collections, ready offline" title="shelf">
      <SegmentedControl onValueChange={setFilter} options={shelfFilters} value={filter} />

      <View style={styles.sectionHeader}>
        <Text variant="eyebrow">MY SHELVES — 4</Text>
        <Text tone="muted" variant="caption">
          {filter}
        </Text>
      </View>

      <View style={styles.shelfList}>
        {figmaShelves.map((shelf) => (
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
                  {shelf.countLabel}
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
