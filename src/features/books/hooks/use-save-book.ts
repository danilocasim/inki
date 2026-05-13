import { useCallback, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { createBooksRepository } from "../repositories/books-repository";
import type { Book, CreateBookInput } from "../types";
import { parseCreateBookInput } from "../validation";

export interface SaveBookState {
  error: string | undefined;
  loading: boolean;
  saveBook: (input: CreateBookInput) => Promise<Book | undefined>;
}

export function useSaveBook(): SaveBookState {
  const db = useSQLiteContext();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const saveBook = useCallback(
    async (input: CreateBookInput): Promise<Book | undefined> => {
      setLoading(true);
      setError(undefined);

      try {
        const parsed = parseCreateBookInput(input);
        return await createBooksRepository(db).create(parsed);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Unable to save book.";
        setError(message);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  return { error, loading, saveBook };
}
