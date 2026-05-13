import type { ReactElement } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { figmaProfile } from "../dashboard/fixtures";
import { Card } from "../../ui/Card";
import { Screen } from "../../ui/Screen";
import { StatTile } from "../../ui/StatTile";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface PrivateProfileScreenProps {
  onOpenSettings: () => void;
}

/** Local-only profile/settings entry from Figma frame 4:691. */
export function PrivateProfileScreen({ onOpenSettings }: PrivateProfileScreenProps): ReactElement {
  return (
    <Screen subtitle="private library, stored on this device" title={figmaProfile.handle}>
      <View style={styles.badge}>
        <Text tone="accent" variant="eyebrow">
          {figmaProfile.privacyBadge}
        </Text>
      </View>

      <View style={styles.statRow}>
        {figmaProfile.stats.map((stat) => (
          <StatTile detail={stat.detail} key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </View>

      <Card style={styles.actions} variant="elevated">
        {figmaProfile.actions.map((action) => (
          <View key={action.label} style={styles.actionRow}>
            <View style={styles.actionCopy}>
              <Text variant="bodyStrong">{action.label}</Text>
              <Text tone="muted" variant="caption">
                {action.detail}
              </Text>
            </View>
            <Text tone="accent" variant="caption">
              local
            </Text>
          </View>
        ))}
      </Card>

      <Card>
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
      </Card>

      <Pressable accessibilityRole="button" onPress={onOpenSettings} style={styles.settingsLink}>
        <Text tone="accent" variant="bodyStrong">
          open privacy settings
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionCopy: {
    flex: 1,
    gap: tokens.space[1]
  },
  actionRow: {
    alignItems: "center",
    borderBottomColor: tokens.color.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: tokens.space[3],
    paddingVertical: tokens.space[3]
  },
  actions: {
    gap: tokens.space[1]
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2]
  },
  genreChip: {
    backgroundColor: tokens.color.surfaceMuted,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2]
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[2],
    marginTop: tokens.space[3]
  },
  settingsLink: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center"
  },
  statRow: {
    flexDirection: "row",
    gap: tokens.space[3]
  }
});
