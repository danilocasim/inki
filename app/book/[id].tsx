import type { ReactElement } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { useBookDetail } from "../../src/features/books/hooks/use-book-detail";
import { deleteBook, updateBook } from "../../src/features/books/repositories/books-repository";
import { BookDetailScreen } from "../../src/features/books/screens/BookDetailScreen";
import type { CreateBookInput } from "../../src/features/books/types";
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
  const db = useSQLiteContext();
  const router = useRouter();
  const { book, loading, reload } = useBookDetail(bookId);

  const handleUpdateBook = async (input: CreateBookInput): Promise<void> => {
    await updateBook(db, bookId, input);
    await reload();
  };

  const handleDeleteBook = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      Alert.alert("Delete book?", "This removes the book from your local library.", [
        { style: "cancel", text: "Cancel", onPress: () => resolve() },
        {
          style: "destructive",
          text: "Delete",
          onPress: () => {
            deleteBook(db, bookId)
              .then(() => {
                router.replace("/");
                resolve();
              })
              .catch(reject);
          },
        },
      ]);
    });
  };

  return (
    <BookDetailScreen
      book={book}
      loading={loading}
      onDeleteBook={handleDeleteBook}
      onReload={() => void reload()}
      onUpdateBook={handleUpdateBook}
    />
  );
}
