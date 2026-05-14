import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, TextInput, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

import { listBooks } from "../../books/repositories/books-repository";
import type { Book } from "../../books/types";
import { useSaveAnnotation } from "../hooks/use-save-annotation";
import { Button } from "../../../ui/Button";
import { Card } from "../../../ui/Card";
import { EmptyState } from "../../../ui/EmptyState";
import { Screen } from "../../../ui/Screen";
import { SegmentedControl } from "../../../ui/SegmentedControl";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface QuoteCaptureScreenProps {
  capturedPhotoUri?: string | undefined;
  onDone?: () => void;
}

export function QuoteCaptureScreen({
  capturedPhotoUri,
  onDone = noop,
}: QuoteCaptureScreenProps): ReactElement {
  const db = useSQLiteContext();
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState<string | undefined>();
  const [loadError, setLoadError] = useState<string | undefined>();
  const [page, setPage] = useState("");
  const [quote, setQuote] = useState("");
  const [savedMessage, setSavedMessage] = useState<string | undefined>();
  const { error, loading, saveQuote } = useSaveAnnotation();

  useEffect(() => {
    let mounted = true;

    const load = async (): Promise<void> => {
      setLoadError(undefined);

      try {
        const items = await listBooks(db);

        if (!mounted) {
          return;
        }

        setBooks(items);
        setBookId((currentBookId) => currentBookId ?? items[0]?.id);
      } catch (caught) {
        if (mounted) {
          setLoadError(caught instanceof Error ? caught.message : "Unable to load local books.");
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [db]);

  const bookOptions = useMemo(
    () => books.slice(0, 8).map((book) => ({ label: book.title, value: book.id })),
    [books]
  );
  const selectedBook = books.find((book) => book.id === bookId);

  const handleSave = async (): Promise<void> => {
    if (!bookId) {
      setSavedMessage(undefined);
      return;
    }

    const parsedPage = parseOptionalPage(page);
    const saved = await saveQuote({
      bookId,
      page: parsedPage,
      text: quote
    });

    if (saved) {
      setQuote("");
      setPage("");
      setSavedMessage(`saved quote for ${selectedBook?.title ?? "book"}`);
    }
  };

  return (
    <Screen contentStyle={styles.content} title="capture quote">
      <Card style={styles.section} variant="ink">
        <Text tone="muted" variant="eyebrow">BOOK</Text>
        {bookOptions.length > 0 ? (
          <SegmentedControl onValueChange={setBookId} options={bookOptions} value={bookId ?? bookOptions[0]?.value ?? ""} />
        ) : (
          <EmptyState message="Add a book before saving a quote." title="No local books" />
        )}
      </Card>

      <Card style={styles.section} variant="ink">
        <Text tone="muted" variant="eyebrow">QUOTE</Text>
        {capturedPhotoUri ? (
          <View style={styles.photoBlock}>
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel="Captured page photo"
              resizeMode="cover"
              source={{ uri: capturedPhotoUri }}
              style={styles.photo}
            />
            <Text tone="muted" variant="caption">
              Type the line you want to save from the photo above.
            </Text>
          </View>
        ) : null}
        <TextInput
          multiline
          onChangeText={(value) => {
            setQuote(value);
            setSavedMessage(undefined);
          }}
          placeholder="Paste or type the sentence that stayed with you."
          placeholderTextColor={tokens.color.muted}
          style={[styles.input, styles.quoteInput]}
          textAlignVertical="top"
          value={quote}
        />
        <TextInput
          keyboardType="number-pad"
          onChangeText={setPage}
          placeholder="page (optional)"
          placeholderTextColor={tokens.color.muted}
          style={styles.input}
          value={page}
        />
        {loadError ? <Text tone="danger">{loadError}</Text> : null}
        {error ? <Text tone="danger">{error}</Text> : null}
        {savedMessage ? <Text tone="accent">{savedMessage}</Text> : null}
        <Button disabled={!bookId || quote.trim().length === 0} label="save quote" loading={loading} onPress={() => void handleSave()} />
        <Button label="done" onPress={onDone} variant="secondary" />
      </Card>
    </Screen>
  );
}

const parseOptionalPage = (value: string): number | undefined => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

const noop = (): void => undefined;

const styles = StyleSheet.create({
  content: {
    paddingTop: tokens.space[6]
  },
  input: {
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.color.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3]
  },
  photo: {
    backgroundColor: tokens.color.black,
    borderRadius: tokens.radius.md,
    height: 200,
    width: "100%"
  },
  photoBlock: {
    gap: tokens.space[2]
  },
  quoteInput: {
    minHeight: 160
  },
  section: {
    gap: tokens.space[4]
  }
});
