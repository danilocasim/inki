import type { ReactElement } from "react";
import { Image, ImageBackground, StyleSheet, TextInput, View } from "react-native";

import type { Book } from "../../books/types";
import { Text } from "../../../ui/Text";
import { fontFamily, tokens } from "../../../ui/tokens";
import { BookCoverArtwork } from "./BookCoverArtwork";
import type { BookShareTemplateId } from "./book-share-templates";
import { EditorialStoryTemplate } from "./EditorialStoryTemplate";
import { cleanQuoteText, scaled } from "./template-utils";

const HIGHLIGHT = tokens.color.gold;

export interface BookShareTemplateArtProps {
  book: Book;
  dateLabel: string;
  editingQuote?: boolean | undefined;
  onChangeQuote?: ((value: string) => void) | undefined;
  onFocusQuote?: (() => void) | undefined;
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
  onFocusQuote,
  photoUri,
  quote,
  scale = 1,
  templateId,
}: BookShareTemplateArtProps): ReactElement {
  if (templateId === "story-quote") {
    return (
      <EditorialStoryTemplate
        book={book}
        dateLabel={dateLabel}
        editingQuote={editingQuote}
        onChangeQuote={onChangeQuote}
        onFocusQuote={onFocusQuote}
        photoUri={photoUri}
        quote={quote}
        scale={scale}
      />
    );
  }

  return (
    <ClassicBookShareTemplate
      book={book}
      dateLabel={dateLabel}
      editingQuote={editingQuote}
      onChangeQuote={onChangeQuote}
      onFocusQuote={onFocusQuote}
      photoUri={photoUri}
      quote={quote}
      scale={scale}
      templateId={templateId}
    />
  );
}

function ClassicBookShareTemplate({
  book,
  dateLabel,
  editingQuote,
  onChangeQuote,
  onFocusQuote,
  photoUri,
  quote,
  scale,
  templateId,
}: Required<
  Pick<
    BookShareTemplateArtProps,
    "book" | "dateLabel" | "photoUri" | "quote" | "scale" | "templateId"
  >
> &
  Pick<
    BookShareTemplateArtProps,
    "editingQuote" | "onChangeQuote" | "onFocusQuote"
  >): ReactElement {
  const isQuoteTemplate = templateId === "quote";
  const cleanQuote = cleanQuoteText(quote);

  const quoteBlock = (
    <View
      style={[styles.cardQuoteBlock, scaled({ paddingHorizontal: 8, paddingVertical: 6 }, scale)]}
    >
      {editingQuote && onChangeQuote ? (
        <TextInput
          accessibilityLabel="Quote text"
          multiline
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
      ) : (
        <Text style={[styles.cardQuoteText, scaled({ fontSize: 22, lineHeight: 30 }, scale)]}>
          {`"${cleanQuote}"`}
        </Text>
      )}
    </View>
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

        {templateId === "cover-left" ? (
          <View
            style={[styles.coverLeft, scaled({ height: 260, marginTop: 18, width: 165 }, scale)]}
          >
            <BookCoverArtwork book={book} scale={scale} />
          </View>
        ) : null}

        {templateId === "cover-center" ? (
          <View
            style={[styles.coverCenter, scaled({ height: 260, marginTop: 18, width: 170 }, scale)]}
          >
            <BookCoverArtwork book={book} scale={scale} />
          </View>
        ) : null}

        <View style={{ flex: 1 }} />
        {quoteBlock}
        {isQuoteTemplate ? <Attribution book={book} scale={scale} /> : null}
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
        style={scaled({ height: 28, width: 70 }, scale)}
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
  cardAttrib: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  cardBookTitle: {
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  cardDate: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "500" },
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
    fontWeight: "800",
    lineHeight: 30,
  },
  coverCenter: {
    alignSelf: "center",
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  coverLeft: {
    alignSelf: "flex-start",
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
});
