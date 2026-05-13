import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { listShelves } from "../repositories/shelves-repository";
import type { Shelf } from "../types";

export interface ShelvesDataState {
  error: Error | undefined;
  loading: boolean;
  reload: () => Promise<void>;
  shelves: Shelf[];
}

export function useShelvesData(): ShelvesDataState {
  const db = useSQLiteContext();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      setShelves(await listShelves(db));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("Unable to load shelves."));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { error, loading, reload, shelves };
}
