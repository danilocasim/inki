import type { ReactElement } from "react";
import { Image, ImageBackground, StyleSheet, TextInput, View } from "react-native";

import type { Book } from "../../books/types";
import { Text } from "../../../ui/Text";
import { fontFamily, tokens } from "../../../ui/tokens";
import { BookCoverArtwork } from "./BookCoverArtwork";
import { QuoteHighlightLines } from "./QuoteHighlightLines";
import { scaled } from "./template-utils";

export interface EditorialStoryTemplateProps {
  book: Book;
  dateLabel: string;
  editingQuote?: boolean | undefined;
  onChangeQuote?: ((value: string) => void) | undefined;
  onFocusQuote?: (() => void) | undefined;
  photoUri: string;
  quote: string;
  scale: number;
}

export function EditorialStoryTemplate({
  book,
  dateLabel,
  editingQuote = false,
  onChangeQuote,
  onFocusQuote,
  photoUri,
  quote,
  scale,
}: EditorialStoryTemplateProps): ReactElement {
  return (
    <ImageBackground
      resizeMode="cover"
      source={{ uri: photoUri }}
      style={styles.art}
      testID="editorial-story-template"
    >
      <View style={styles.photoScrim} />
      <Text style={[styles.date, scaled({ fontSize: 30, lineHeight: 36 }, scale)]}>
        {dateLabel}
      </Text>

      <View style={styles.coverFrame}>
        <BookCoverArtwork book={book} scale={scale} />
      </View>

      <View style={styles.quoteFrame}>
        {editingQuote && onChangeQuote ? (
          <TextInput
            accessibilityLabel="Quote text"
            multiline
            onChangeText={onChangeQuote}
            onFocus={onFocusQuote}
            placeholder="Type the line..."
            placeholderTextColor="rgba(255,255,255,0.72)"
            scrollEnabled={false}
            style={[
              styles.quoteInput,
              scaled({ fontSize: 40, lineHeight: 48, minHeight: 168, padding: 6 }, scale),
            ]}
            textAlignVertical="top"
            value={quote}
          />
        ) : (
          <QuoteHighlightLines quote={quote} scale={scale} />
        )}
      </View>

      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="inki watermark"
        resizeMode="contain"
        source={require("../../../assets/transparent-white-logo.png")}
        style={[styles.logo, scaled({ height: 52, width: 86 }, scale)]}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  art: {
    aspectRatio: 9 / 16,
    backgroundColor: tokens.color.black,
    flex: 1,
    overflow: "hidden",
  },
  coverFrame: {
    aspectRatio: 0.64,
    left: "10%",
    overflow: "hidden",
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { height: 13, width: 0 },
    shadowOpacity: 0.58,
    shadowRadius: 20,
    top: "22%",
    width: "51%",
  },
  date: {
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 30,
    fontWeight: "800",
    left: "10%",
    letterSpacing: 0,
    lineHeight: 36,
    position: "absolute",
    textShadowColor: "rgba(0,0,0,0.38)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 10,
    top: "13.7%",
  },
  logo: {
    bottom: "3.4%",
    height: 52,
    position: "absolute",
    right: "5.8%",
    width: 86,
  },
  photoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  quoteFrame: {
    bottom: "13.6%",
    left: "10%",
    position: "absolute",
    right: "7%",
  },
  quoteInput: {
    backgroundColor: "rgba(143,124,38,0.86)",
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 48,
  },
});
