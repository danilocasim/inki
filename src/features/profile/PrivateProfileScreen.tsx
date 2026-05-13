import type { ReactElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { figmaProfile } from "../dashboard/fixtures";
import { Card } from "../../ui/Card";
import { IconButton, type FeatherIconName } from "../../ui/IconButton";
import { Screen } from "../../ui/Screen";
import { StatTile } from "../../ui/StatTile";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface PrivateProfileScreenProps {
  exportingLibrary?: boolean;
  message?: string | undefined;
  onExportLibrary?: () => Promise<void> | void;
  onOpenNotifications?: () => void;
  onOpenPassport?: () => void;
  onOpenSettings: () => void;
  onOpenWrapped?: () => void;
}

/** Local-only profile/settings entry from Figma frame 4:691. */
export function PrivateProfileScreen({
  exportingLibrary = false,
  message,
  onExportLibrary = noopAsync,
  onOpenNotifications = noop,
  onOpenPassport = noop,
  onOpenSettings,
  onOpenWrapped = noop,
}: PrivateProfileScreenProps): ReactElement {
  const actionForLabel = (label: string): (() => void) => {
    if (label === "reading wrapped") {
      return onOpenWrapped;
    }

    if (label === "annual passport") {
      return onOpenPassport;
    }

    if (label === "export library") {
      return () => void onExportLibrary();
    }

    return onOpenSettings;
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="screenTitle">profile</Text>
        <View style={styles.headerActions}>
          <IconButton label="Open reading wrapped" name="share-2" onPress={onOpenWrapped} />
          <IconButton label="Open settings" name="settings" onPress={onOpenSettings} />
        </View>
      </View>

      <View style={styles.identityRow}>
        <View style={styles.avatar}>
          <Text variant="screenTitle">A</Text>
        </View>
        <View style={styles.identityCopy}>
          <Text variant="screenTitle">{figmaProfile.handle}</Text>
          <Text tone="muted" variant="bodyStrong">
            reader · inki since Jan 2026
          </Text>
          <View style={styles.badge}>
            <Text tone="muted" variant="eyebrow">
              {figmaProfile.privacyBadge}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statRow}>
        {profileStats.map((stat) => (
          <StatTile detail={stat.detail} key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </View>

      <View style={styles.actionList}>
        {figmaProfile.actions.map((action, index) => (
          <ProfileActionRow
            accent={index === 0}
            detail={
              action.label === "export library" && exportingLibrary
                ? "exporting JSON backup..."
                : action.detail
            }
            disabled={action.label === "export library" && exportingLibrary}
            key={action.label}
            label={action.label}
            onPress={actionForLabel(action.label)}
          />
        ))}
        <ProfileActionRow
          accent={false}
          detail="local reminder inbox"
          label="open notifications"
          onPress={onOpenNotifications}
        />
      </View>

      {message ? (
        <Text tone="accent" style={styles.message}>
          {message}
        </Text>
      ) : null}

      <View style={styles.genresSection}>
        <Text tone="muted" variant="eyebrow">
          top genres
        </Text>
        <View style={styles.genreRow}>
          {figmaProfile.genres.map((genre) => (
            <View key={genre} style={styles.genreChip}>
              <Text variant="caption">{genre}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function ProfileActionRow({
  accent,
  detail,
  disabled = false,
  label,
  onPress,
}: {
  accent: boolean;
  detail: string;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
      <Card
        style={[
          styles.actionRow,
          accent ? styles.actionRowAccent : undefined,
          disabled ? styles.actionRowDisabled : undefined,
        ]}
        variant="ink"
      >
        <View style={styles.actionIcon}>
          <Feather color={tokens.color.accent} name={iconForProfileAction(label)} size={20} />
        </View>
        <View style={styles.actionCopy}>
          <Text variant="bodyStrong">{label}</Text>
          <Text tone={accent ? "accent" : "muted"} variant="bodyStrong">
            {detail}
          </Text>
        </View>
        <Feather
          color={accent ? tokens.color.accent : tokens.color.muted}
          name="chevron-right"
          size={22}
        />
      </Card>
    </Pressable>
  );
}

const iconForProfileAction = (label: string): FeatherIconName => {
  if (label === "reading wrapped") {
    return "zap";
  }

  if (label === "annual passport") {
    return "file-text";
  }

  if (label === "export library") {
    return "download";
  }

  if (label === "open notifications") {
    return "bell";
  }

  return "shield";
};

const noop = (): void => undefined;
const noopAsync = async (): Promise<void> => undefined;

const profileStats = [
  { detail: "books finished", label: "books", value: "17" },
  { detail: "bookmarks", label: "bookmarks", value: "7d" },
  { detail: "reading streak", label: "streak", value: "12d" },
  { detail: "total pages", label: "pages", value: "4.8k" },
  { detail: "changed me", label: "changed", value: "5" },
] as const;

const styles = StyleSheet.create({
  actionCopy: {
    flex: 1,
    gap: tokens.space[1],
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  actionList: {
    gap: tokens.space[3],
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[4],
    minHeight: 98,
  },
  actionRowAccent: {
    backgroundColor: "#4E4B86",
    borderColor: "#6C67B0",
  },
  actionRowDisabled: {
    opacity: 0.55,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#7D4C79",
    borderColor: tokens.color.accent,
    borderRadius: tokens.radius.pill,
    borderWidth: 2,
    height: 104,
    justifyContent: "center",
    width: 104,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  genreChip: {
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[2],
    marginTop: tokens.space[3],
  },
  genresSection: {
    gap: tokens.space[3],
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    gap: tokens.space[3],
  },
  identityCopy: {
    flex: 1,
    gap: tokens.space[2],
  },
  identityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[5],
  },
  message: {
    textAlign: "center",
  },
  content: {
    paddingBottom: tokens.space[12],
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[3],
  },
});
