import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { listNotifications } from "../repositories/notifications-log-repository";
import type { NotificationLogItem } from "../types";

export interface NotificationsState {
  items: NotificationLogItem[];
  loading: boolean;
  reload: () => Promise<void>;
}

export function useNotifications(): NotificationsState {
  const db = useSQLiteContext();
  const [items, setItems] = useState<NotificationLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      setItems(await listNotifications(db));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, reload };
}
