import type { ReactElement } from "react";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { BookCover } from "../BookCover";
import type { Book } from "../types";
import { useSaveSession } from "../../sessions/hooks/use-save-session";
import { Button } from "../../../ui/Button";
import { Card } from "../../../ui/Card";
import { EmptyState } from "../../../ui/EmptyState";
import { Screen } from "../../../ui/Screen";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface BookDetailScreenProps {
  book?: Book | undefined;
  loading?: boolean;
  onReload?: () => void;
}

export function BookDetailScreen({
  book,
  loading = false,
  onReload = noop
}: BookDetailScreenProps): ReactElement {
  const [nextPage, setNextPage] = useState(book?.currentPage.toString() ?? "0");
  const { error, loading: saving, saveSession } = useSaveSession();

  if (loading) {
    return (
      <Screen title="book">
        <Text tone="muted">Loading local book...</Text>
      </Screen>
    );
  }

  if (!book) {
    return (
      <Screen title="book">
        <EmptyState message="This local book could not be found." title="Book not found" />
      </Screen>
    );
  }

  const progress = book.progress ?? 0;

  const handleSaveProgress = async (): Promise<void> => {
    const currentPage = Number(nextPage);
    const pagesRead = Math.max(0, currentPage - book.currentPage);
    const saved = await saveSession({
      bookId: book.id,
      currentPage,
      pagesRead,
      readAt: new Date().toISOString()
    });

    if (saved) {
      onReload();
    }
  };

  return (
    <Screen title={book.title} subtitle={book.author}>
      <Card style={styles.hero} variant="elevated">
        <BookCover book={book} showAuthor={false} size="lg" />
        <View style={styles.heroCopy}>
          <Text variant="sectionTitle">{book.title}</Text>
          <Text tone="muted">{book.author}</Text>
          <Text tone="muted">
            {book.currentPage} / {book.totalPages ?? "?"} pages • currently {book.status}
          </Text>
          {book.genre ? <View style={styles.chip}><Text variant="caption">{book.genre}</Text></View> : null}
        </View>
      </Card>

      <Card>
        <Text tone="muted" variant="eyebrow">YOUR PROGRESS</Text>
        <Text variant="hero">{progress}%</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </Card>

      <Card style={styles.formCard}>
        <Text variant="sectionTitle">log today</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setNextPage}
          style={styles.input}
          value={nextPage}
        />
        {error ? <Text tone="danger">{error}</Text> : null}
        <Button label="save progress" loading={saving} onPress={() => void handleSaveProgress()} />
      </Card>

      <View style={styles.actionRow}>
        <Button label="view notes" onPress={noop} variant="secondary" />
        <Button label="+ create bookmark" onPress={noop} variant="secondary" />
      </View>
    </Screen>
  );
}

const noop = (): void => undefined;

const styles = StyleSheet.create({
  actionRow: {
    gap: tokens.space[3]
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: tokens.color.surfaceMuted,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2]
  },
  formCard: {
    gap: tokens.space[3]
  },
  hero: {
    flexDirection: "row",
    gap: tokens.space[4]
  },
  heroCopy: {
    flex: 1,
    gap: tokens.space[2]
  },
  input: {
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.color.ink,
    fontSize: 24,
    fontWeight: "900",
    minHeight: 56,
    paddingHorizontal: tokens.space[4]
  },
  progressFill: {
    backgroundColor: tokens.color.accent,
    borderRadius: tokens.radius.pill,
    height: 10
  },
  progressTrack: {
    backgroundColor: tokens.color.surfaceMuted,
    borderRadius: tokens.radius.pill,
    height: 10,
    overflow: "hidden"
  }
});
