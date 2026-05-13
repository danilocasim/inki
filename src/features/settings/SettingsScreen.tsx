import type { ReactElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Card } from "../../ui/Card";
import { Screen } from "../../ui/Screen";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface SettingsScreenProps {
  onOpenNotifications?: () => void;
  onOpenWrapped?: () => void;
}

/** Local settings surface: no account, no backend, no tracking. */
export function SettingsScreen({
  onOpenNotifications = noop,
  onOpenWrapped = noop
}: SettingsScreenProps): ReactElement {
  return (
    <Screen subtitle="no account, no tracking, no cloud requirement" title="settings">
      <Card style={styles.section}>
        <Text tone="muted" variant="eyebrow">NOTIFICATIONS</Text>
        <SettingsRow detail="9:00 PM • 12 day streak" label="daily share streak" onPress={onOpenNotifications} />
        <SettingsRow detail="off" label="read reminder" onPress={onOpenNotifications} />
      </Card>

      <Card style={styles.section}>
        <Text tone="muted" variant="eyebrow">BACKUP</Text>
        <SettingsRow detail="manual export • no server sync" label="iCloud sync" />
      </Card>

      <Card style={styles.section}>
        <Text tone="muted" variant="eyebrow">DATA</Text>
        <SettingsRow detail="JSON + cover images" label="export all data" />
        <SettingsRow detail="from JSON backup" label="import" />
        <SettingsRow detail="export year as PDF" label="annual book passport" onPress={onOpenWrapped} />
      </Card>

      <Card style={styles.section}>
        <Text tone="muted" variant="eyebrow">ABOUT</Text>
        <SettingsRow detail="3.2 • offline-first" label="version" />
        <SettingsRow destructive detail="cannot be undone" label="erase all data" />
      </Card>

      <Card style={styles.section} variant="ink">
        <Text tone="inverse" variant="sectionTitle">local data policy</Text>
        <Text tone="inverse">
          Books, shelves, quotes, notifications, and exports stay on this device until you
          explicitly share or export them.
        </Text>
      </Card>
    </Screen>
  );
}

interface SettingsRowProps {
  destructive?: boolean;
  detail: string;
  label: string;
  onPress?: () => void;
}

function SettingsRow({ destructive = false, detail, label, onPress = noop }: SettingsRowProps): ReactElement {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.rowCopy}>
        <Text tone={destructive ? "danger" : "default"} variant="bodyStrong">{label}</Text>
        <Text tone="muted" variant="caption">{detail}</Text>
      </View>
      <Text tone={destructive ? "danger" : "accent"}>→</Text>
    </Pressable>
  );
}

const noop = (): void => undefined;

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: tokens.color.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: tokens.space[3],
    minHeight: 56,
    paddingVertical: tokens.space[2]
  },
  rowCopy: {
    flex: 1,
    gap: tokens.space[1]
  },
  section: {
    gap: tokens.space[2]
  }
});
