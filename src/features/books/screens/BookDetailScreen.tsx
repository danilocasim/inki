import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";

import { BookCover } from "../BookCover";
import { BookForm, bookFormValuesFromDraft } from "../components/BookForm";
import type { Book, CreateBookInput } from "../types";
import { useBookAnnotations } from "../../quotes/hooks/use-book-annotations";
import { useSaveAnnotation } from "../../quotes/hooks/use-save-annotation";
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
  onDeleteBook?: () => Promise<void> | void;
  onReload?: () => void;
  onUpdateBook?: (input: CreateBookInput) => Promise<void> | void;
}

export function BookDetailScreen({
  book,
  loading = false,
  onDeleteBook = noopAsync,
  onReload = noop,
  onUpdateBook = noopUpdateBook,
}: BookDetailScreenProps): ReactElement {
  const [nextPage, setNextPage] = useState(book?.currentPage.toString() ?? "0");
  const [noteDraft, setNoteDraft] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [editing, setEditing] = useState(false);
  const [managementError, setManagementError] = useState<string | undefined>();
  const [managementLoading, setManagementLoading] = useState(false);
  const annotations = useBookAnnotations(book?.id);
  const annotationSave = useSaveAnnotation();
  const { error, loading: saving, saveSession } = useSaveSession();

  useEffect(() => {
    setNextPage(book?.currentPage.toString() ?? "0");
  }, [book?.currentPage, book?.id]);

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

  const sliderMax = book.totalPages ?? 100;
  const parsedNextPage = parseSliderPage(nextPage, sliderMax);
  const liveProgress = computeLiveProgress(nextPage, book.totalPages);

  const handleSaveProgress = async (): Promise<void> => {
    const currentPage = parsePage(nextPage, book.currentPage, book.totalPages);
    const pagesRead = Math.max(0, currentPage - book.currentPage);
    const saved = await saveSession({
      bookId: book.id,
      currentPage,
      pagesRead,
      readAt: new Date().toISOString(),
    });

    if (saved) {
      onReload();
    }
  };

  const handleCreateBookmark = async (): Promise<void> => {
    const page = parsePage(nextPage, book.currentPage, book.totalPages);
    const saved = await annotationSave.saveBookmark({
      bookId: book.id,
      label: `Page ${page}`,
      page,
    });

    if (saved) {
      setShowNotes(true);
      await annotations.reload();
    }
  };

  const handleSaveNote = async (): Promise<void> => {
    const page = parsePage(nextPage, book.currentPage, book.totalPages);
    const saved = await annotationSave.saveNote({
      body: noteDraft,
      bookId: book.id,
      page,
      title: `Page ${page}`,
    });

    if (saved) {
      setNoteDraft("");
      await annotations.reload();
    }
  };

  const handleUpdateBook = (input: CreateBookInput): void => {
    setManagementLoading(true);
    setManagementError(undefined);

    try {
      const result = onUpdateBook(input);
      const handleSuccess = (): void => {
        setEditing(false);
        onReload();
      };

      if (isPromiseLike(result)) {
        void Promise.resolve(result)
          .then(handleSuccess)
          .catch((caught: unknown) => {
            setManagementError(caught instanceof Error ? caught.message : "Unable to update book.");
          })
          .finally(() => setManagementLoading(false));
        return;
      }

      handleSuccess();
    } catch (caught) {
      setManagementError(caught instanceof Error ? caught.message : "Unable to update book.");
    } finally {
      setManagementLoading(false);
    }
  };

  const handleDeleteBook = (): void => {
    setManagementLoading(true);
    setManagementError(undefined);

    try {
      const result = onDeleteBook();

      if (isPromiseLike(result)) {
        void Promise.resolve(result)
          .catch((caught: unknown) => {
            setManagementError(caught instanceof Error ? caught.message : "Unable to delete book.");
          })
          .finally(() => setManagementLoading(false));
        return;
      }
    } catch (caught) {
      setManagementError(caught instanceof Error ? caught.message : "Unable to delete book.");
    } finally {
      setManagementLoading(false);
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
          {book.genre ? (
            <View style={styles.chip}>
              <Text variant="caption">{book.genre}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card>
        <Text tone="muted" variant="eyebrow">
          YOUR PROGRESS
        </Text>
        <Text variant="hero">{liveProgress}%</Text>
        <Slider
          accessibilityLabel="Reading progress"
          maximumTrackTintColor={tokens.color.border}
          maximumValue={sliderMax}
          minimumTrackTintColor={tokens.color.accent}
          minimumValue={0}
          onValueChange={(value) => setNextPage(String(Math.round(value)))}
          step={1}
          style={styles.progressSlider}
          thumbTintColor={tokens.color.accent}
          value={parsedNextPage}
        />
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
        <Button
          label={showNotes ? "hide notes" : "view notes"}
          onPress={() => setShowNotes((current) => !current)}
          variant="secondary"
        />
        <Button
          label="+ create bookmark"
          loading={annotationSave.loading}
          onPress={() => void handleCreateBookmark()}
          variant="secondary"
        />
      </View>

      {editing ? (
        <Card style={styles.managementCard} variant="ink">
          <Text tone="muted" variant="eyebrow">
            BOOK DETAILS
          </Text>
          <BookForm
            defaultValues={bookFormValuesFromDraft(book)}
            error={managementError}
            loading={managementLoading}
            onSubmit={handleUpdateBook}
            submitLabel="save changes"
          />
          <Button
            label="delete book"
            loading={managementLoading}
            onPress={handleDeleteBook}
            variant="secondary"
          />
        </Card>
      ) : (
        <Card style={styles.managementCard} variant="ink">
          <View style={styles.managementHeader}>
            <View>
              <Text tone="muted" variant="eyebrow">
                MANAGE BOOK
              </Text>
              <Text tone="muted" variant="caption">
                Edit details, cover, status, or remove it.
              </Text>
            </View>
          </View>
          {managementError ? <Text tone="danger">{managementError}</Text> : null}
          <View style={styles.managementActions}>
            <Button label="edit book" onPress={() => setEditing(true)} variant="secondary" />
            <Button
              label="delete book"
              loading={managementLoading}
              onPress={handleDeleteBook}
              variant="secondary"
            />
          </View>
        </Card>
      )}

      {showNotes ? (
        <Card style={styles.annotationsCard} variant="ink">
          <View style={styles.annotationHeader}>
            <View>
              <Text tone="muted" variant="eyebrow">
                NOTES & BOOKMARKS
              </Text>
              <Text variant="sectionTitle">
                {annotations.notes.length} notes · {annotations.bookmarks.length} bookmarks
              </Text>
            </View>
          </View>

          <TextInput
            multiline
            onChangeText={setNoteDraft}
            placeholder="Write a note for the current page."
            placeholderTextColor={tokens.color.muted}
            style={[styles.input, styles.noteInput]}
            textAlignVertical="top"
            value={noteDraft}
          />
          {annotationSave.error ? <Text tone="danger">{annotationSave.error}</Text> : null}
          <Button
            disabled={noteDraft.trim().length === 0}
            label="save note"
            loading={annotationSave.loading}
            onPress={() => void handleSaveNote()}
          />

          {annotations.loading ? <Text tone="muted">Loading notes...</Text> : null}
          <AnnotationList
            bookmarks={annotations.bookmarks}
            notes={annotations.notes}
            quotes={annotations.quotes}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const noop = (): void => undefined;
const noopAsync = async (): Promise<void> => undefined;
const noopUpdateBook = async (_input: CreateBookInput): Promise<void> => undefined;
const isPromiseLike = (value: unknown): value is PromiseLike<void> =>
  typeof value === "object" &&
  value !== null &&
  "then" in value &&
  typeof value.then === "function";

const parsePage = (value: string, fallback: number, totalPages: number | undefined): number => {
  const parsed = Number(value);
  const page = Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;

  return totalPages === undefined ? page : Math.min(page, totalPages);
};

const parseSliderPage = (value: string, max: number): number => {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, max);
};

export const computeLiveProgress = (
  nextPage: string,
  totalPages: number | undefined,
): number => {
  if (nextPage.trim() === "") return 0;
  const parsed = Number(nextPage);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  if (totalPages === undefined || totalPages <= 0) {
    return Math.min(100, Math.max(0, Math.round(parsed)));
  }
  return Math.min(100, Math.round((parsed / totalPages) * 100));
};

function AnnotationList({
  bookmarks,
  notes,
  quotes,
}: {
  bookmarks: readonly { id: string; label?: string | undefined; page: number }[];
  notes: readonly {
    body: string;
    id: string;
    page?: number | undefined;
    title?: string | undefined;
  }[];
  quotes: readonly { id: string; page?: number | undefined; text: string }[];
}): ReactElement {
  const hasItems = bookmarks.length + notes.length + quotes.length > 0;

  if (!hasItems) {
    return <Text tone="muted">No notes or bookmarks yet.</Text>;
  }

  return (
    <View style={styles.annotationList}>
      {bookmarks.map((bookmark) => (
        <View key={bookmark.id} style={styles.annotationItem}>
          <Text tone="accent" variant="caption">
            bookmark · p. {bookmark.page}
          </Text>
          <Text variant="bodyStrong">{bookmark.label ?? `Page ${bookmark.page}`}</Text>
        </View>
      ))}
      {notes.map((note) => (
        <View key={note.id} style={styles.annotationItem}>
          <Text tone="accent" variant="caption">
            note{note.page === undefined ? "" : ` · p. ${note.page}`}
          </Text>
          {note.title ? <Text variant="bodyStrong">{note.title}</Text> : null}
          <Text tone="muted">{note.body}</Text>
        </View>
      ))}
      {quotes.map((quote) => (
        <View key={quote.id} style={styles.annotationItem}>
          <Text tone="accent" variant="caption">
            quote{quote.page === undefined ? "" : ` · p. ${quote.page}`}
          </Text>
          <Text tone="muted">{quote.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  annotationHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  annotationItem: {
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    gap: tokens.space[1],
    padding: tokens.space[3],
  },
  annotationList: {
    gap: tokens.space[3],
  },
  annotationsCard: {
    gap: tokens.space[4],
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[3],
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: tokens.color.surfaceMuted,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  formCard: {
    gap: tokens.space[3],
  },
  hero: {
    flexDirection: "row",
    gap: tokens.space[4],
  },
  heroCopy: {
    flex: 1,
    gap: tokens.space[2],
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
    paddingHorizontal: tokens.space[4],
  },
  managementActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[3],
  },
  managementCard: {
    gap: tokens.space[4],
  },
  managementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noteInput: {
    fontSize: 16,
    fontWeight: "500",
    minHeight: 120,
    paddingVertical: tokens.space[3],
  },
  progressSlider: {
    height: 44,
    width: "100%",
  },
});
