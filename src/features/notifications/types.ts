export interface NotificationLogItem {
  body: string;
  id: string;
  isRead: boolean;
  sentAt?: string | undefined;
  title: string;
  type: string;
}

export interface NotificationLogRow {
  body: string;
  id: string;
  is_read: number;
  sent_at: string | null;
  title: string;
  type: string;
}

export const mapNotificationLogRow = (row: NotificationLogRow): NotificationLogItem => ({
  body: row.body,
  id: row.id,
  isRead: row.is_read === 1,
  sentAt: row.sent_at ?? undefined,
  title: row.title,
  type: row.type
});
