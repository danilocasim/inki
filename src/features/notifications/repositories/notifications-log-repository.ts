import type { DatabaseReader } from "../../../lib/db";
import type { NotificationLogItem, NotificationLogRow } from "../types";
import { mapNotificationLogRow } from "../types";

export const listNotifications = async (db: DatabaseReader): Promise<NotificationLogItem[]> => {
  const rows = await db.getAllAsync<NotificationLogRow>(
    `SELECT id, type, title, body, sent_at, is_read
     FROM notifications_log
     ORDER BY COALESCE(sent_at, scheduled_for, created_at) DESC;`,
    []
  );

  return rows.map(mapNotificationLogRow);
};
