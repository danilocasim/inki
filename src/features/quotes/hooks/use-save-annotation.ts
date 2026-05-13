import { useCallback, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { createAnnotationsRepository } from "../repositories/annotations-repository";
import type {
  Bookmark,
  BookNote,
  CreateBookmarkInput,
  CreateBookNoteInput,
  CreateQuoteInput,
  Quote
} from "../types";

export interface SaveAnnotationState {
  error: string | undefined;
  loading: boolean;
  saveBookmark: (input: CreateBookmarkInput) => Promise<Bookmark | undefined>;
  saveNote: (input: CreateBookNoteInput) => Promise<BookNote | undefined>;
  saveQuote: (input: CreateQuoteInput) => Promise<Quote | undefined>;
}

export function useSaveAnnotation(): SaveAnnotationState {
  const db = useSQLiteContext();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const saveBookmark = useCallback(
    async (input: CreateBookmarkInput): Promise<Bookmark | undefined> => {
      setLoading(true);
      setError(undefined);

      try {
        return await createAnnotationsRepository(db).addBookmark(input);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to save bookmark.");
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const saveNote = useCallback(
    async (input: CreateBookNoteInput): Promise<BookNote | undefined> => {
      setLoading(true);
      setError(undefined);

      try {
        return await createAnnotationsRepository(db).addNote(input);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to save note.");
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const saveQuote = useCallback(
    async (input: CreateQuoteInput): Promise<Quote | undefined> => {
      setLoading(true);
      setError(undefined);

      try {
        return await createAnnotationsRepository(db).addQuote(input);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to save quote.");
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  return { error, loading, saveBookmark, saveNote, saveQuote };
}
