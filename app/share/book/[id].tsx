import type { ReactElement } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useBookDetail } from "../../../src/features/books/hooks/use-book-detail";
import { useBookAnnotations } from "../../../src/features/quotes/hooks/use-book-annotations";
import { BookShareScreen } from "../../../src/features/share-cards/screens/BookShareScreen";
import { EmptyState } from "../../../src/ui/EmptyState";
import { Screen } from "../../../src/ui/Screen";
import { Text } from "../../../src/ui/Text";

export default function BookShareRoute(): ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const bookId = typeof id === "string" ? id : "";
  const { book, loading } = useBookDetail(bookId);
  const annotations = useBookAnnotations(bookId || undefined);

  if (loading) {
    return (
      <Screen title="share">
        <Text tone="muted">Loading book…</Text>
      </Screen>
    );
  }

  if (!book) {
    return (
      <Screen title="share">
        <EmptyState message="This book could not be found." title="Book not found" />
      </Screen>
    );
  }

  const initialQuote =
    annotations.quotes[0]?.text ??
    annotations.notes[0]?.body ??
    undefined;

  return (
    <BookShareScreen
      book={book}
      initialQuote={initialQuote}
      onClose={() => router.back()}
    />
  );
}
