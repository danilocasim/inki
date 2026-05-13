import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getShelfById } from "../repositories/shelves-repository";
import type { Shelf } from "../types";

export interface ShelfDetailState {
  error: Error | undefined;
  loading: boolean;
  reload: () => Promise<void>;
  shelf: Shelf | undefined;
}

export function useShelfDetail(shelfId: string): ShelfDetailState {
  const db = useSQLiteContext();
  const [shelf, setShelf] = useState<Shelf | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      setShelf(await getShelfById(db, shelfId));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("Unable to load shelf."));
    } finally {
      setLoading(false);
    }
  }, [db, shelfId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { error, loading, reload, shelf };
}
