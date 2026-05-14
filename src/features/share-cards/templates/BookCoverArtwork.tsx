import type { ReactElement } from "react";
import { Image, StyleSheet, View } from "react-native";

import type { Book } from "../../books/types";
import { Text } from "../../../ui/Text";
import { fontFamily, tokens } from "../../../ui/tokens";
import { scaled } from "./template-utils";

export function BookCoverArtwork({ book, scale }: { book: Book; scale: number }): ReactElement {
  const coverUri =
    typeof book.coverPath === "string" && book.coverPath.length > 0 ? book.coverPath : undefined;

  if (coverUri) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={`Book image for ${book.title}`}
        resizeMode="cover"
        source={{ uri: coverUri }}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={`Default book cover for ${book.title}`}
      style={[styles.coverFallback, { backgroundColor: book.palette.cover }]}
    >
      <View style={[styles.coverFallbackSpine, { backgroundColor: book.palette.spine }]} />
      <Text
        numberOfLines={3}
        style={[styles.coverFallbackTitle, scaled({ fontSize: 17, lineHeight: 20 }, scale)]}
      >
        {book.title}
      </Text>
      <Text numberOfLines={2} style={[styles.coverFallbackAuthor, scaled({ fontSize: 9 }, scale)]}>
        {book.author}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  coverFallback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    overflow: "hidden",
    padding: tokens.space[3],
  },
  coverFallbackAuthor: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0,
    marginTop: tokens.space[2],
    textTransform: "uppercase",
  },
  coverFallbackSpine: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 12,
  },
  coverFallbackTitle: {
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 20,
    textTransform: "uppercase",
  },
});
