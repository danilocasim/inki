import { useCallback, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { createShelf } from "../repositories/shelves-repository";
import type { CreateShelfInput, Shelf } from "../types";

export interface CreateShelfState {
  create: (input: CreateShelfInput) => Promise<Shelf | undefined>;
  error: string | undefined;
  loading: boolean;
}

export function useCreateShelf(): CreateShelfState {
  const db = useSQLiteContext();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const create = useCallback(
    async (input: CreateShelfInput): Promise<Shelf | undefined> => {
      setLoading(true);
      setError(undefined);

      try {
        return await createShelf(db, input);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to create shelf.");
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  return { create, error, loading };
}
