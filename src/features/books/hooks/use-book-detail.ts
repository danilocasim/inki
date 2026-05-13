import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getBookById } from "../repositories/books-repository";
import type { Book } from "../types";

export interface BookDetailState {
  book: Book | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => Promise<void>;
}

export function useBookDetail(bookId: string): BookDetailState {
  const db = useSQLiteContext();
  const [book, setBook] = useState<Book | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      setBook(await getBookById(db, bookId));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("Unable to load book."));
    } finally {
      setLoading(false);
    }
  }, [bookId, db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { book, error, loading, reload };
}
