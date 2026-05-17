import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { buildDashboardData } from "../services/stats-service";
import type { DashboardData } from "../types";
import { listBooks } from "../../books/repositories/books-repository";
import { countBookmarksByDay } from "../../quotes/repositories/annotations-repository";

export interface DashboardDataState {
  data: DashboardData | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => Promise<void>;
}

/** Loads dashboard data from local SQLite only. */
export function useDashboardData(): DashboardDataState {
  const db = useSQLiteContext();
  const [data, setData] = useState<DashboardData | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const [books, bookmarkCounts] = await Promise.all([
        listBooks(db),
        countBookmarksByDay(db)
      ]);
      setData(buildDashboardData(books, bookmarkCounts));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("Unable to load dashboard."));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}
