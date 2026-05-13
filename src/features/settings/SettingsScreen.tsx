import type { ReactElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "../../ui/Card";
import type { FeatherIconName } from "../../ui/IconButton";
import { Screen } from "../../ui/Screen";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface SettingsScreenProps {
  busyAction?: SettingsAction | undefined;
  dailyShareStreakEnabled?: boolean;
  iCloudSyncEnabled?: boolean;
  message?: string | undefined;
  onEraseAllData?: () => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onOpenNotifications?: () => void;
  onOpenWrapped?: () => void;
  onToggleDailyShareStreak?: (enabled: boolean) => void;
  onToggleICloudSync?: (enabled: boolean) => void;
  onToggleReadReminder?: (enabled: boolean) => void;
  readReminderEnabled?: boolean;
}

export type SettingsAction = "erase" | "export" | "import";

/** Local settings surface: no account, no backend, no tracking. */
export function SettingsScreen({
  busyAction,
  dailyShareStreakEnabled = true,
  iCloudSyncEnabled = false,
  message,
  onEraseAllData = noop,
  onExportData = noop,
  onImportData = noop,
  onOpenNotifications = noop,
  onOpenWrapped = noop,
  onToggleDailyShareStreak = noopBoolean,
  onToggleICloudSync = noopBoolean,
  onToggleReadReminder = noopBoolean,
  readReminderEnabled = false
}: SettingsScreenProps): ReactElement {
  return (
    <Screen contentStyle={styles.content} title="settings">
      <Card style={styles.section} variant="ink">
        <Text tone="muted" variant="eyebrow">NOTIFICATIONS</Text>
        <SettingsRow
          detail={dailyShareStreakEnabled ? "9:00 PM · 12 day streak" : "off"}
          icon="share-2"
          label="daily share streak"
          onPress={() => onToggleDailyShareStreak(!dailyShareStreakEnabled)}
          toggle={dailyShareStreakEnabled ? "on" : "off"}
        />
        <SettingsRow
          detail={readReminderEnabled ? "on" : "off"}
          icon="bell"
          label="read reminder"
          onPress={() => onToggleReadReminder(!readReminderEnabled)}
          toggle={readReminderEnabled ? "on" : "off"}
        />
        <SettingsRow detail="notification inbox" icon="inbox" label="open notifications" onPress={onOpenNotifications} />
      </Card>

      <Card style={styles.section} variant="ink">
        <Text tone="muted" variant="eyebrow">BACKUP</Text>
        <SettingsRow
          detail={iCloudSyncEnabled ? "enabled for local file backup" : "off"}
          icon="cloud"
          label="iCloud sync"
          onPress={() => onToggleICloudSync(!iCloudSyncEnabled)}
          toggle={iCloudSyncEnabled ? "on" : "off"}
        />
      </Card>

      <Card style={styles.section} variant="ink">
        <Text tone="muted" variant="eyebrow">DATA</Text>
        <SettingsRow
          detail={busyAction === "export" ? "exporting..." : "JSON backup"}
          icon="download"
          label="export all data"
          onPress={onExportData}
        />
        <SettingsRow
          detail={busyAction === "import" ? "importing..." : "from JSON backup"}
          icon="upload"
          label="import"
          onPress={onImportData}
        />
        <SettingsRow detail="export year as card" icon="file-text" label="annual book passport" onPress={onOpenWrapped} />
      </Card>

      <Card style={styles.section} variant="ink">
        <Text tone="muted" variant="eyebrow">ABOUT</Text>
        <SettingsRow detail="0.1.0 · offline-first" icon="info" label="version" />
        <SettingsRow
          destructive
          detail={busyAction === "erase" ? "erasing..." : "requires confirmation"}
          icon="trash-2"
          label="erase all data"
          onPress={onEraseAllData}
        />
      </Card>

      {message ? <Text tone="accent" style={styles.message}>{message}</Text> : null}

      <View style={styles.footer}>
        <Text tone="muted" variant="caption">no accounts. no servers. no tracking.</Text>
        <Text tone="muted" variant="caption">your books live on your device.</Text>
      </View>
    </Screen>
  );
}

interface SettingsRowProps {
  destructive?: boolean;
  detail: string;
  icon: FeatherIconName;
  label: string;
  onPress?: () => void;
  toggle?: "off" | "on" | undefined;
}

function SettingsRow({ destructive = false, detail, icon, label, onPress = noop, toggle }: SettingsRowProps): ReactElement {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={[styles.rowIcon, destructive ? styles.rowIconDanger : undefined]}>
        <Feather color={destructive ? tokens.color.danger : tokens.color.accent} name={icon} size={19} />
      </View>
      <View style={styles.rowCopy}>
        <Text tone={destructive ? "danger" : "default"} variant="bodyStrong">{label}</Text>
        <Text tone="muted" variant="caption">{detail}</Text>
      </View>
      {toggle ? (
        <Toggle state={toggle} />
      ) : (
        <Feather color={destructive ? tokens.color.danger : tokens.color.muted} name="chevron-right" size={20} />
      )}
    </Pressable>
  );
}

function Toggle({ state }: { state: "off" | "on" }): ReactElement {
  const enabled = state === "on";

  return (
    <View style={[styles.toggleTrack, enabled ? styles.toggleTrackOn : undefined]}>
      <View style={[styles.toggleThumb, enabled ? styles.toggleThumbOn : undefined]} />
    </View>
  );
}

const noop = (): void => undefined;
const noopBoolean = (_enabled: boolean): void => undefined;

const styles = StyleSheet.create({
  content: {
    paddingBottom: tokens.space[12]
  },
  footer: {
    alignItems: "center",
    gap: tokens.space[2],
    paddingVertical: tokens.space[6]
  },
  message: {
    textAlign: "center"
  },
  row: {
    alignItems: "center",
    borderBottomColor: tokens.color.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: tokens.space[3],
    minHeight: 72,
    paddingVertical: tokens.space[3]
  },
  rowCopy: {
    flex: 1,
    gap: tokens.space[1]
  },
  rowIcon: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  rowIconDanger: {
    backgroundColor: "#2A1717"
  },
  section: {
    gap: tokens.space[2]
  },
  toggleThumb: {
    backgroundColor: tokens.color.black,
    borderRadius: tokens.radius.pill,
    height: 28,
    width: 28
  },
  toggleThumbOn: {
    transform: [{ translateX: 28 }]
  },
  toggleTrack: {
    backgroundColor: tokens.color.border,
    borderRadius: tokens.radius.pill,
    padding: 4,
    width: 64
  },
  toggleTrackOn: {
    backgroundColor: tokens.color.accent
  }
});
