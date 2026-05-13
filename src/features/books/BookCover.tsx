import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import type { FigmaBook } from "../dashboard/fixtures";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export type BookCoverSize = "sm" | "md" | "lg";

export interface BookCoverProps {
  book: FigmaBook;
  showAuthor?: boolean;
  size?: BookCoverSize;
}

/** Static cover primitive for the Figma fixture pass before image storage exists. */
export function BookCover({ book, showAuthor = true, size = "md" }: BookCoverProps): ReactElement {
  return (
    <View style={styles.container}>
      <View style={[styles.cover, coverSizes[size], { backgroundColor: book.palette.cover }]}>
        <View style={[styles.spine, { backgroundColor: book.palette.spine }]} />
        <Text numberOfLines={3} style={styles.coverTitle} tone="inverse" variant="caption">
          {book.title}
        </Text>
      </View>
      {showAuthor ? (
        <View style={[styles.meta, metaWidths[size]]}>
          <Text numberOfLines={2} variant="caption">
            {book.title}
          </Text>
          <Text numberOfLines={1} tone="muted" variant="caption">
            {book.author}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const coverSizes = StyleSheet.create({
  lg: {
    height: 170,
    width: 118
  },
  md: {
    height: 142,
    width: 96
  },
  sm: {
    height: 108,
    width: 72
  }
});

const metaWidths = StyleSheet.create({
  lg: {
    width: 118
  },
  md: {
    width: 96
  },
  sm: {
    width: 72
  }
});

const styles = StyleSheet.create({
  container: {
    gap: tokens.space[2]
  },
  cover: {
    borderRadius: tokens.radius.sm,
    justifyContent: "flex-end",
    overflow: "hidden",
    padding: tokens.space[3]
  },
  coverTitle: {
    textTransform: "uppercase"
  },
  meta: {
    gap: tokens.space[1]
  },
  spine: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 10
  }
});
