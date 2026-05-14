import type { ReactElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import type { NotificationLogItem } from "../types";
import { Card } from "../../../ui/Card";
import { EmptyState } from "../../../ui/EmptyState";
import { IconButton } from "../../../ui/IconButton";
import { Screen } from "../../../ui/Screen";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface NotificationsScreenProps {
  items: readonly NotificationLogItem[];
  loading?: boolean;
  onClose: () => void;
  onOpenItem?: (item: NotificationLogItem) => void;
}

export function NotificationsScreen({
  items,
  loading = false,
  onClose,
  onOpenItem = noopOpenItem,
}: NotificationsScreenProps): ReactElement {
  if (loading) {
    return (
      <Screen contentStyle={styles.content}>
        <NotificationsHeader onClose={onClose} />
        <Text tone="muted">Loading local notifications...</Text>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <NotificationsHeader onClose={onClose} />
      {items.length === 0 ? (
        <EmptyState
          message="Local reminders will appear here after you enable them in settings."
          title="No notifications yet"
        />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <Pressable
              accessibilityLabel={`Open notification: ${item.title}`}
              accessibilityRole="button"
              key={item.id}
              onPress={() => onOpenItem(item)}
            >
              <Card style={styles.item} variant="ink">
                <View style={styles.iconBadge}>
                  <Feather
                    color={tokens.color.accent}
                    name={iconForNotificationType(item.type)}
                    size={20}
                  />
                </View>
                <View style={styles.itemCopy}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle} variant="bodyStrong">
                      {item.title}
                    </Text>
                    {!item.isRead ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text tone="muted">{item.body}</Text>
                  <Text tone="muted" variant="eyebrow">
                    {item.sentAt ? formatTime(item.sentAt) : "local"}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
      <Text tone="muted" style={styles.footer} variant="caption">
        scheduled locally · no push servers
      </Text>
    </Screen>
  );
}

function NotificationsHeader({ onClose }: { onClose: () => void }): ReactElement {
  return (
    <View style={styles.header}>
      <Text variant="screenTitle">notifications</Text>
      <IconButton label="Close notifications" name="x" onPress={onClose} />
    </View>
  );
}

const formatTime = (iso: string): string => {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? "local"
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const iconForNotificationType = (type: string): "bell" | "book-open" | "share-2" | "zap" => {
  if (type === "share-streak") {
    return "share-2";
  }

  if (type === "read-reminder") {
    return "book-open";
  }

  if (type === "wrapped") {
    return "zap";
  }

  return "bell";
};

const noopOpenItem = (_item: NotificationLogItem): void => undefined;

const styles = StyleSheet.create({
  content: {
    gap: tokens.space[5],
    paddingTop: tokens.space[6],
  },
  footer: {
    marginTop: tokens.space[6],
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  item: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: tokens.space[4],
    minHeight: 124,
  },
  itemCopy: {
    flex: 1,
    gap: tokens.space[2],
  },
  itemHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: tokens.space[2],
    justifyContent: "space-between",
  },
  itemTitle: {
    flex: 1,
  },
  list: {
    gap: tokens.space[3],
  },
  unreadDot: {
    backgroundColor: tokens.color.accent,
    borderRadius: tokens.radius.pill,
    height: 7,
    marginTop: 8,
    width: 7,
  },
});
