import type { ReactElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { Book } from "../books/types";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface BookSpineProps {
  book: Book;
  index: number;
  onPress: (bookId: string) => void;
  selected: boolean;
}

interface SpineSize {
  height: number;
  width: number;
}

const fallbackSpineSize: SpineSize = { height: 226, width: 54 };

const spineSizes: readonly SpineSize[] = [
  fallbackSpineSize,
  { height: 210, width: 48 },
  { height: 238, width: 60 },
  { height: 220, width: 52 },
  { height: 232, width: 58 },
  { height: 214, width: 50 },
] as const;

/** Renders a tactile, readable shelf spine with book-title and author details. */
export function BookSpine({ book, index, onPress, selected }: BookSpineProps): ReactElement {
  const size = spineSizes[index % spineSizes.length] ?? fallbackSpineSize;
  const textColor = book.palette.text;

  return (
    <Pressable
      accessibilityHint={book.author}
      accessibilityLabel={`Select ${book.title}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(book.id)}
      style={({ pressed }) => [
        styles.book,
        {
          backgroundColor: book.palette.spine,
          height: size.height,
          width: size.width,
        },
        selected ? styles.bookSelected : undefined,
        pressed ? styles.bookPressed : undefined,
      ]}
    >
      <View style={[styles.coverEdge, { backgroundColor: book.palette.cover }]} />
      <View style={styles.shadowEdge} />
      <View style={[styles.capBand, styles.capTop]} />
      <View style={[styles.capBand, styles.capBottom]} />
      <View style={styles.innerGroove} />
      <View style={styles.labelFrame}>
        <View style={[styles.labelRail, { width: size.height - 42 }]}>
          <Text numberOfLines={2} style={[styles.title, { color: textColor }]} variant="caption">
            {book.title}
          </Text>
          <Text numberOfLines={1} style={[styles.author, { color: textColor }]} variant="caption">
            {book.author}
          </Text>
        </View>
      </View>
      <View style={styles.publisherMark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  author: {
    opacity: 0.9,
    textAlign: "center",
  },
  book: {
    borderColor: "rgba(255, 249, 240, 0.16)",
    borderRadius: tokens.radius.sm,
    borderWidth: 2,
    justifyContent: "center",
    overflow: "hidden",
  },
  bookPressed: {
    opacity: 0.86,
  },
  bookSelected: {
    borderColor: tokens.color.accent,
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    transform: [{ translateY: -8 }],
  },
  capBand: {
    backgroundColor: "rgba(255, 249, 240, 0.16)",
    borderRadius: tokens.radius.xs,
    height: 10,
    left: tokens.space[3],
    position: "absolute",
    right: tokens.space[2],
  },
  capBottom: {
    bottom: tokens.space[3],
  },
  capTop: {
    top: tokens.space[3],
  },
  coverEdge: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 8,
  },
  innerGroove: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    bottom: tokens.space[4],
    left: tokens.space[4],
    position: "absolute",
    top: tokens.space[4],
    width: 1,
  },
  labelFrame: {
    alignItems: "center",
    bottom: tokens.space[5],
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: tokens.space[5],
  },
  labelRail: {
    alignItems: "center",
    gap: tokens.space[1],
    transform: [{ rotate: "-90deg" }],
  },
  publisherMark: {
    alignSelf: "center",
    backgroundColor: "rgba(255, 249, 240, 0.3)",
    borderRadius: tokens.radius.pill,
    bottom: 7,
    height: 5,
    position: "absolute",
    width: 18,
  },
  shadowEdge: {
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: 5,
  },
  title: {
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
    textTransform: "uppercase",
  },
});
