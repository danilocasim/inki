import type { ReactElement } from "react";
import { Image, ImageBackground, Pressable, StyleSheet, TextInput, View } from "react-native";

import type { Book } from "../../books/types";
import { Text } from "../../../ui/Text";
import { fontFamily, tokens } from "../../../ui/tokens";
import { BookCoverArtwork } from "./BookCoverArtwork";
import { QuoteHighlightLines } from "./QuoteHighlightLines";
import { scaled } from "./template-utils";

export type EditorialStorySide = "left" | "right";

export interface EditorialStoryTemplateProps {
  book: Book;
  dateLabel: string;
  editingQuote?: boolean | undefined;
  onChangeQuote?: ((value: string) => void) | undefined;
  onEndEditQuote?: (() => void) | undefined;
  onFocusQuote?: (() => void) | undefined;
  onStartEditQuote?: (() => void) | undefined;
  photoUri: string;
  quote: string;
  scale: number;
  side?: EditorialStorySide;
}

export function EditorialStoryTemplate({
  book,
  dateLabel,
  editingQuote = false,
  onChangeQuote,
  onEndEditQuote,
  onFocusQuote,
  onStartEditQuote,
  photoUri,
  quote,
  scale,
  side = "left",
}: EditorialStoryTemplateProps): ReactElement {
  const isRight = side === "right";

  return (
    <ImageBackground
      resizeMode="cover"
      source={{ uri: photoUri }}
      style={styles.art}
      testID="editorial-story-template"
    >
      <View pointerEvents="none" style={styles.photoScrim} />
      <Text
        style={[
          styles.date,
          isRight ? styles.dateRight : styles.dateLeft,
          scaled({ fontSize: 18, lineHeight: 24 }, scale),
        ]}
      >
        {dateLabel}
      </Text>

      <View style={[styles.coverFrame, isRight ? styles.coverFrameRight : styles.coverFrameLeft]}>
        <BookCoverArtwork book={book} scale={scale} />
      </View>

      <View
        style={[styles.quoteFrame, isRight ? styles.quoteFrameRight : styles.quoteFrameLeft]}
      >
        {editingQuote && onChangeQuote ? (
          <TextInput
            accessibilityLabel="Quote text"
            autoFocus
            multiline
            onBlur={onEndEditQuote}
            onChangeText={onChangeQuote}
            onFocus={onFocusQuote}
            placeholder="Type the line..."
            placeholderTextColor="rgba(255,255,255,0.72)"
            scrollEnabled={false}
            style={[
              styles.quoteInput,
              isRight ? styles.quoteInputRight : undefined,
              scaled({ fontSize: 40, lineHeight: 48, minHeight: 168, padding: 6 }, scale),
            ]}
            textAlignVertical="top"
            value={quote}
          />
        ) : onStartEditQuote ? (
          <Pressable
            accessibilityHint="Tap to edit the quote"
            accessibilityLabel="Edit quote"
            accessibilityRole="button"
            hitSlop={20}
            onPress={onStartEditQuote}
            style={({ pressed }) => [
              styles.editableWrap,
              pressed ? styles.editablePressed : undefined,
            ]}
          >
            <QuoteHighlightLines alignment={side} quote={quote} scale={scale} />
          </Pressable>
        ) : (
          <QuoteHighlightLines alignment={side} quote={quote} scale={scale} />
        )}
      </View>

      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="inki watermark"
        resizeMode="contain"
        source={require("../../../assets/transparent-white-logo.png")}
        style={[
          styles.logo,
          isRight ? styles.logoLeft : styles.logoRight,
          scaled({ height: 52, width: 86 }, scale),
        ]}
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
    overflow: "hidden",
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { height: 13, width: 0 },
    shadowOpacity: 0.58,
    shadowRadius: 20,
    top: "22%",
    width: "51%",
  },
  coverFrameLeft: { left: "10%" },
  coverFrameRight: { right: "10%" },
  date: {
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    letterSpacing: 0,
    lineHeight: 24,
    position: "absolute",
    textShadowColor: "rgba(0,0,0,0.38)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 10,
    top: "13.7%",
  },
  editablePressed: { opacity: 0.85 },
  editableWrap: { alignSelf: "stretch" },
  dateLeft: { left: "10%" },
  dateRight: { right: "10%", textAlign: "right" },
  logo: {
    bottom: "3.4%",
    height: 52,
    position: "absolute",
    width: 86,
  },
  logoLeft: { left: "5.8%" },
  logoRight: { right: "5.8%" },
  photoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  quoteFrame: {
    bottom: "13.6%",
    position: "absolute",
  },
  quoteFrameLeft: { left: "10%", right: "7%" },
  quoteFrameRight: { left: "7%", right: "10%" },
  quoteInput: {
    backgroundColor: "rgba(143,124,38,0.86)",
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 40,
    letterSpacing: 0,
    lineHeight: 48,
  },
  quoteInputRight: { textAlign: "right" },
});
