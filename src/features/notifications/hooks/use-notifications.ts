import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { listNotifications, markNotificationRead } from "../repositories/notifications-log-repository";
import type { NotificationLogItem } from "../types";

export interface NotificationsState {
  items: NotificationLogItem[];
  loading: boolean;
  markRead: (id: string) => Promise<void>;
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

  const markRead = useCallback(
    async (id: string): Promise<void> => {
      await markNotificationRead(db, id);
      await reload();
    },
    [db, reload]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, markRead, reload };
}
