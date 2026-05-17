import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { figmaBooks, figmaShelves, shelfFilters, type BookStatus } from "../dashboard/fixtures";
import type { Shelf } from "./types";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { IconButton } from "../../ui/IconButton";
import { Screen } from "../../ui/Screen";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

interface ShelfCardModel extends Shelf {
  spineColors: readonly string[];
}

export interface ShelfOverviewScreenProps {
  createError?: string | undefined;
  creatingShelf?: boolean;
  onCreateShelf?: (name: string) => Promise<void> | void;
  onOpenShelf: (shelfId: string) => void;
  onShareWall?: () => void;
  shelves?: readonly Shelf[];
}

/** Shelf overview for screenshots 11-12, backed by local SQLite when provided. */
export function ShelfOverviewScreen({
  createError,
  creatingShelf = false,
  onCreateShelf = noopCreateShelf,
  onOpenShelf,
  onShareWall = noop,
  shelves
}: ShelfOverviewScreenProps): ReactElement {
  const [filter, setFilter] = useState<BookStatus | "all">("all");
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [shelfName, setShelfName] = useState("");
  const allShelves: readonly ShelfCardModel[] = shelves
    ? shelves.map((shelf) => ({
        ...shelf,
        spineColors: shelf.books?.map((book) => book.palette.cover) ?? [],
      }))
    : figmaShelves.map((shelf) => ({
        accent: shelf.accent,
        count: shelf.bookIds.length,
        id: shelf.id,
        kind: "custom" as const,
        spineColors: shelf.bookIds
          .map((bookId) => figmaBooks.find((book) => book.id === bookId)?.palette.cover)
          .filter((color): color is string => Boolean(color)),
        subtitle: shelf.subtitle,
        title: shelf.title,
      }));
  const normalizedQuery = query.trim().toLowerCase();
  const visibleShelves = normalizedQuery.length === 0
    ? allShelves
    : allShelves.filter((shelf) =>
        `${shelf.title} ${shelf.subtitle}`.toLowerCase().includes(normalizedQuery)
      );

  const handleCreateShelf = async (): Promise<void> => {
    const name = shelfName.trim();

    if (name.length === 0) {
      return;
    }

    await onCreateShelf(name);
    setShelfName("");
    setCreating(false);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="screenTitle">shelf</Text>
        <View style={styles.headerActions}>
          <IconButton
            label="Search shelves"
            name="search"
            onPress={() => setQuery((current) => (current.length > 0 ? "" : " "))}
          />
          <IconButton
            label="Create shelf"
            name="plus"
            onPress={() => setCreating((current) => !current)}
            variant="accent"
          />
        </View>
      </View>

      <View style={styles.headerDivider} />

      {query.length > 0 ? (
        <TextInput
          autoFocus
          onChangeText={setQuery}
          placeholder="Search your shelves"
          placeholderTextColor={tokens.color.muted}
          style={styles.input}
          value={query.trimStart()}
        />
      ) : null}

      <SegmentedControl onValueChange={setFilter} options={shelfFilters} value={filter} />

      <View style={styles.sectionHeader}>
        <Text variant="eyebrow">MY SHELVES — {visibleShelves.length}</Text>
        <Text tone="muted" variant="caption">
          {filter}
        </Text>
      </View>

      {creating ? (
        <Card style={styles.createCard} variant="ink">
          <Text tone="muted" variant="eyebrow">NEW SHELF</Text>
          <TextInput
            onChangeText={setShelfName}
            placeholder="Shelf name"
            placeholderTextColor={tokens.color.muted}
            style={styles.input}
            value={shelfName}
          />
          {createError ? <Text tone="danger">{createError}</Text> : null}
          <Button
            disabled={shelfName.trim().length === 0}
            label="create shelf"
            loading={creatingShelf}
            onPress={() => void handleCreateShelf()}
          />
        </Card>
      ) : null}

      <View style={styles.shelfList}>
        {visibleShelves.map((shelf) => (
          <ShelfCard key={shelf.id} onOpen={onOpenShelf} shelf={shelf} />
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={() => setCreating(true)} style={styles.newShelfButton}>
        <Text tone="muted" variant="bodyStrong">+  new shelf</Text>
      </Pressable>

      <View style={styles.archiveSection}>
        <Text tone="muted" variant="eyebrow">ARCHIVE WALL</Text>
        <View style={styles.archiveGrid}>
          {archiveColors.map((color, index) => <View key={`${color}-${index}`} style={[styles.archiveBook, { backgroundColor: color }]} />)}
        </View>
        <View style={styles.archiveFooter}>
          <Text tone="muted" variant="bodyStrong">17 books · 2026</Text>
          <Pressable accessibilityRole="button" onPress={onShareWall} style={styles.shareWall}>
            <Text variant="caption">share wall</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const noop = (): void => undefined;
const noopCreateShelf = async (_name: string): Promise<void> => undefined;

function ShelfCard({
  onOpen,
  shelf,
}: {
  onOpen: (shelfId: string) => void;
  shelf: ShelfCardModel;
}): ReactElement {
  const previewSpines = shelf.spineColors.length > 0
    ? shelf.spineColors.slice(0, 6)
    : [shelf.accent];

  return (
    <Pressable
      accessibilityLabel={`Open ${shelf.title}`}
      accessibilityRole="button"
      onPress={() => onOpen(shelf.id)}
    >
      <Card style={styles.shelfCard} variant="ink">
        <View style={[styles.shelfAccentBar, { backgroundColor: shelf.accent }]} />
        <View style={styles.shelfBody}>
          <View style={styles.shelfHeader}>
            <Text tone="muted" variant="eyebrow">
              {`${shelf.count} BOOKS`}
            </Text>
            {shelf.kind === "custom" ? (
              <Text tone="accent" variant="eyebrow">PRIVATE</Text>
            ) : null}
          </View>
          <Text variant="sectionTitle">{shelf.title}</Text>
          <Text tone="muted" variant="caption">
            {shelf.subtitle}
          </Text>
          <View style={styles.spineRow}>
            {previewSpines.map((color, index) => (
              <View
                key={`${shelf.id}-spine-${index}`}
                style={[styles.spine, { backgroundColor: color }]}
              />
            ))}
          </View>
        </View>
        <Feather color={tokens.color.muted} name="chevron-right" size={22} />
      </Card>
    </Pressable>
  );
}

const archiveColors = [
  "#66539A",
  "#346A56",
  "#563257",
  "#855024",
  "#264A78",
  "#40542D",
  "#9D4142",
  "#254A78",
  "#9A4042",
  "#315656",
  "#664432",
  "#40562E",
  "#66539A"
] as const;

const styles = StyleSheet.create({
  archiveBook: {
    borderRadius: tokens.radius.sm,
    height: 122,
    width: 61
  },
  archiveFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  archiveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[3]
  },
  archiveSection: {
    gap: tokens.space[4]
  },
  content: {
    paddingBottom: 112
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[2]
  },
  headerDivider: {
    backgroundColor: tokens.color.border,
    height: 1
  },
  createCard: {
    gap: tokens.space[3]
  },
  input: {
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.color.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: tokens.space[4]
  },
  newShelfButton: {
    alignItems: "center",
    borderColor: "#5A6C88",
    borderRadius: tokens.radius.lg,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 70
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  shelfAccentBar: {
    alignSelf: "stretch",
    borderRadius: tokens.radius.pill,
    width: 4
  },
  shelfBody: {
    flex: 1,
    gap: tokens.space[2]
  },
  shelfCard: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: tokens.space[4],
    minHeight: 138
  },
  shelfHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[2],
    justifyContent: "space-between"
  },
  shelfList: {
    gap: tokens.space[3]
  },
  shareWall: {
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2]
  },
  spine: {
    borderRadius: 2,
    flex: 1,
    height: 38,
    maxWidth: 14,
    minWidth: 6
  },
  spineRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: tokens.space[2]
  }
});
