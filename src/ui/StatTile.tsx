import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { tokens } from "./tokens";

export interface StatTileProps {
  detail?: string;
  label: string;
  value: string;
}

/** Compact metric tile for dashboard and profile statistics. */
export function StatTile({ detail, label, value }: StatTileProps): ReactElement {
  return (
    <View style={styles.container}>
      <Text tone="muted" variant="eyebrow">
        {label}
      </Text>
      <Text variant="stat">{value}</Text>
      {detail ? <Text tone="muted" variant="caption">{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    flex: 1,
    gap: tokens.space[1],
    minWidth: 130,
    padding: tokens.space[4]
  }
});
