import type { DatabaseReader, DatabaseWriter } from "../../../lib/db";
import { nowIso } from "../../../lib/time";
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

export const markNotificationRead = async (db: DatabaseWriter, id: string): Promise<void> => {
  const now = nowIso();

  await db.runAsync(
    `UPDATE notifications_log
     SET is_read = 1, tapped_at = COALESCE(tapped_at, ?)
     WHERE id = ?;`,
    [now, id]
  );
};
