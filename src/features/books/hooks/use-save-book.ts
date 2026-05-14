import { useCallback, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { createBooksRepository } from "../repositories/books-repository";
import type { Book, CreateBookInput } from "../types";
import { parseCreateBookInput } from "../validation";
import { addBookToShelf } from "../../shelves/repositories/shelves-repository";

export interface SaveBookOptions {
  shelfIds?: readonly string[] | undefined;
}

export interface SaveBookState {
  error: string | undefined;
  loading: boolean;
  saveBook: (input: CreateBookInput, options?: SaveBookOptions) => Promise<Book | undefined>;
}

export function useSaveBook(): SaveBookState {
  const db = useSQLiteContext();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const saveBook = useCallback(
    async (input: CreateBookInput, options?: SaveBookOptions): Promise<Book | undefined> => {
      setLoading(true);
      setError(undefined);

      try {
        const parsed = parseCreateBookInput(input);
        const shelfIds = options?.shelfIds ?? [];

        if (shelfIds.length === 0) {
          return await createBooksRepository(db).create(parsed);
        }

        let createdBook: Book | undefined;

        await db.withExclusiveTransactionAsync(async (txn) => {
          const book = await createBooksRepository(txn).create(parsed);

          for (const shelfId of shelfIds) {
            await addBookToShelf(txn, shelfId, book.id);
          }

          createdBook = book;
        });

        if (!createdBook) {
          throw new Error("Book was saved but could not be read back from local SQLite.");
        }

        return createdBook;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Unable to save book.";
        setError(message);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  return { error, loading, saveBook };
}
