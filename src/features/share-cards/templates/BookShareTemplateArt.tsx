import type { ReactElement } from "react";
import { Image, ImageBackground, Pressable, StyleSheet, TextInput, View } from "react-native";

import type { Book } from "../../books/types";
import { Text } from "../../../ui/Text";
import { fontFamily, tokens } from "../../../ui/tokens";
import type { BookShareTemplateId } from "./book-share-templates";
import { EditorialStoryTemplate } from "./EditorialStoryTemplate";
import { QuoteHighlightLines } from "./QuoteHighlightLines";
import { scaled } from "./template-utils";

const HIGHLIGHT = tokens.color.gold;

export interface BookShareTemplateArtProps {
  book: Book;
  dateLabel: string;
  editingQuote?: boolean | undefined;
  onChangeQuote?: ((value: string) => void) | undefined;
  onEndEditQuote?: (() => void) | undefined;
  onFocusQuote?: (() => void) | undefined;
  onStartEditQuote?: (() => void) | undefined;
  photoUri: string;
  quote: string;
  scale?: number;
  templateId: BookShareTemplateId;
}

export function BookShareTemplateArt({
  book,
  dateLabel,
  editingQuote = false,
  onChangeQuote,
  onEndEditQuote,
  onFocusQuote,
  onStartEditQuote,
  photoUri,
  quote,
  scale = 1,
  templateId,
}: BookShareTemplateArtProps): ReactElement {
  if (templateId === "story-quote" || templateId === "story-quote-right") {
    return (
      <EditorialStoryTemplate
        book={book}
        dateLabel={dateLabel}
        editingQuote={editingQuote}
        onChangeQuote={onChangeQuote}
        onEndEditQuote={onEndEditQuote}
        onFocusQuote={onFocusQuote}
        onStartEditQuote={onStartEditQuote}
        photoUri={photoUri}
        quote={quote}
        scale={scale}
        side={templateId === "story-quote-right" ? "right" : "left"}
      />
    );
  }

  return (
    <ClassicBookShareTemplate
      book={book}
      dateLabel={dateLabel}
      editingQuote={editingQuote}
      onChangeQuote={onChangeQuote}
      onEndEditQuote={onEndEditQuote}
      onFocusQuote={onFocusQuote}
      onStartEditQuote={onStartEditQuote}
      photoUri={photoUri}
      quote={quote}
      scale={scale}
    />
  );
}

function ClassicBookShareTemplate({
  book,
  dateLabel,
  editingQuote,
  onChangeQuote,
  onEndEditQuote,
  onFocusQuote,
  onStartEditQuote,
  photoUri,
  quote,
  scale,
}: Required<
  Pick<BookShareTemplateArtProps, "book" | "dateLabel" | "photoUri" | "quote" | "scale">
> &
  Pick<
    BookShareTemplateArtProps,
    "editingQuote" | "onChangeQuote" | "onEndEditQuote" | "onFocusQuote" | "onStartEditQuote"
  >): ReactElement {
  const quoteBlock =
    editingQuote && onChangeQuote ? (
      <View
        style={[styles.cardQuoteBlock, scaled({ paddingHorizontal: 8, paddingVertical: 6 }, scale)]}
      >
        <TextInput
          accessibilityLabel="Quote text"
          autoFocus
          multiline
          onBlur={onEndEditQuote}
          onChangeText={onChangeQuote}
          onFocus={onFocusQuote}
          placeholder="Type the line..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          scrollEnabled={false}
          style={[
            styles.cardQuoteText,
            styles.cardQuoteInput,
            scaled({ fontSize: 22, lineHeight: 30 }, scale),
          ]}
          textAlignVertical="top"
          value={quote}
        />
      </View>
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
        <QuoteHighlightLines
          baseFontSize={22}
          baseLineHeight={30}
          basePaddingHorizontal={6}
          basePaddingVertical={2}
          quote={quote}
          scale={scale}
        />
      </Pressable>
    ) : (
      <QuoteHighlightLines
        baseFontSize={22}
        baseLineHeight={30}
        basePaddingHorizontal={6}
        basePaddingVertical={2}
        quote={quote}
        scale={scale}
      />
    );

  return (
    <ImageBackground
      imageStyle={styles.cardImage}
      resizeMode="cover"
      source={{ uri: photoUri }}
      style={styles.cardArt}
    >
      <View style={[styles.cardOverlay, scaled({ padding: 22 }, scale)]}>
        <Text style={[styles.cardDate, scaled({ fontSize: 15 }, scale)]}>{dateLabel}</Text>
        <View style={{ flex: 1 }} />
        {quoteBlock}
        <Attribution book={book} scale={scale} />
        <Brand scale={scale} />
      </View>
    </ImageBackground>
  );
}

function Attribution({ book, scale }: { book: Book; scale: number }): ReactElement {
  return (
    <View style={scaled({ marginTop: 14 }, scale)}>
      <View style={styles.cardDivider} />
      <Text style={[styles.cardAttrib, scaled({ fontSize: 14, paddingVertical: 4 }, scale)]}>
        pg. {book.currentPage || 0} · {book.author}
      </Text>
      <View style={styles.cardDivider} />
      <Text style={[styles.cardBookTitle, scaled({ fontSize: 22, paddingVertical: 6 }, scale)]}>
        {book.title}
      </Text>
    </View>
  );
}

function Brand({ scale }: { scale: number }): ReactElement {
  return (
    <View style={[styles.cardFooterRow, scaled({ marginTop: 14 }, scale)]}>
      <View style={{ flex: 1 }} />
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="inki watermark"
        resizeMode="contain"
        source={require("../../../assets/transparent-white-logo.png")}
        style={[styles.cardBrandLogo, scaled({ height: 40, width: 100, marginRight: -8 }, scale)]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardArt: {
    aspectRatio: 9 / 16,
    backgroundColor: tokens.color.black,
    borderRadius: tokens.radius.md,
    flex: 1,
    overflow: "hidden",
  },
  cardAttrib: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: fontFamily.bold,
    fontSize: 14,
  },
  cardBookTitle: {
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    letterSpacing: 0.2,
  },
  cardBrandLogo: { alignSelf: "flex-end" },
  cardDate: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: fontFamily.bold,
    fontSize: 14,
  },
  cardDivider: { backgroundColor: "rgba(255,255,255,0.25)", height: 1, marginVertical: 6 },
  cardFooterRow: { alignItems: "center", flexDirection: "row" },
  cardImage: { borderRadius: tokens.radius.md },
  cardOverlay: { backgroundColor: "rgba(0,0,0,0.35)", flex: 1, padding: 20 },
  cardQuoteBlock: { backgroundColor: HIGHLIGHT + "BB", borderRadius: 3, padding: 6 },
  cardQuoteInput: {
    minHeight: 96,
    padding: 0,
  },
  cardQuoteText: {
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 30,
  },
  editablePressed: { opacity: 0.85 },
  editableWrap: { alignSelf: "stretch" },
});
