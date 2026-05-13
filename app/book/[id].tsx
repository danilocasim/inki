import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { useBookDetail } from "../../src/features/books/hooks/use-book-detail";
import { BookDetailScreen } from "../../src/features/books/screens/BookDetailScreen";
import { EmptyState } from "../../src/ui/EmptyState";
import { Screen } from "../../src/ui/Screen";

export default function BookDetailRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const bookId = typeof id === "string" ? id : undefined;

  if (!bookId) {
    return (
      <Screen title="book">
        <EmptyState message="Choose a book from your stack or shelf." title="No book selected" />
      </Screen>
    );
  }

  return <BookDetailContainer bookId={bookId} />;
}

function BookDetailContainer({ bookId }: { bookId: string }): ReactElement {
  const { book, loading, reload } = useBookDetail(bookId);

  return <BookDetailScreen book={book} loading={loading} onReload={() => void reload()} />;
}
