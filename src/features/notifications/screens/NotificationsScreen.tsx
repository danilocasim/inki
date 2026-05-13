import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import type { NotificationLogItem } from "../types";
import { Card } from "../../../ui/Card";
import { EmptyState } from "../../../ui/EmptyState";
import { Screen } from "../../../ui/Screen";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface NotificationsScreenProps {
  items: readonly NotificationLogItem[];
  loading?: boolean;
}

export function NotificationsScreen({ items, loading = false }: NotificationsScreenProps): ReactElement {
  if (loading) {
    return (
      <Screen title="notifications">
        <Text tone="muted">Loading local notifications...</Text>
      </Screen>
    );
  }

  return (
    <Screen subtitle="scheduled locally • no push servers" title="notifications">
      {items.length === 0 ? (
        <EmptyState
          message="Local reminders will appear here after you enable them in settings."
          title="No notifications yet"
        />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <Card key={item.id} style={styles.item} variant="elevated">
              <View style={styles.itemHeader}>
                <Text variant="bodyStrong">{item.title}</Text>
                <Text tone="muted" variant="caption">
                  {item.sentAt ? formatTime(item.sentAt) : "local"}
                </Text>
              </View>
              <Text tone="muted">{item.body}</Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const formatTime = (iso: string): string => {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? "local" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const styles = StyleSheet.create({
  item: {
    gap: tokens.space[2]
  },
  itemHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  list: {
    gap: tokens.space[3]
  }
});
