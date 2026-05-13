import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { listBookAnnotations } from "../repositories/annotations-repository";
import type { BookAnnotations } from "../types";

export interface BookAnnotationsState extends BookAnnotations {
  error: Error | undefined;
  loading: boolean;
  reload: () => Promise<void>;
}

const emptyAnnotations: BookAnnotations = {
  bookmarks: [],
  notes: [],
  quotes: []
};

export function useBookAnnotations(bookId: string | undefined): BookAnnotationsState {
  const db = useSQLiteContext();
  const [annotations, setAnnotations] = useState<BookAnnotations>(emptyAnnotations);
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(Boolean(bookId));

  const reload = useCallback(async () => {
    if (!bookId) {
      setAnnotations(emptyAnnotations);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      setAnnotations(await listBookAnnotations(db, bookId));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("Unable to load notes and bookmarks."));
    } finally {
      setLoading(false);
    }
  }, [bookId, db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...annotations, error, loading, reload };
}
