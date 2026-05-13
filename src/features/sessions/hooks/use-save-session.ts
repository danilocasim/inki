import { useCallback, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { createSessionsRepository } from "../repositories/sessions-repository";
import type { UpdateBookProgressInput } from "../../books/types";

export interface SaveSessionState {
  error: string | undefined;
  loading: boolean;
  saveSession: (input: UpdateBookProgressInput) => Promise<boolean>;
}

export function useSaveSession(): SaveSessionState {
  const db = useSQLiteContext();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const saveSession = useCallback(
    async (input: UpdateBookProgressInput): Promise<boolean> => {
      setLoading(true);
      setError(undefined);

      try {
        await createSessionsRepository(db).addProgress(input);
        return true;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to save reading session.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  return { error, loading, saveSession };
}
