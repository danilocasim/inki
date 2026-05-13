import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "./Button";
import { Text } from "./Text";
import { tokens } from "./tokens";

export interface EmptyStateProps {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  title: string;
}

/** Reusable local-first empty state that never implies account setup. */
export function EmptyState({
  actionLabel,
  message,
  onAction,
  title
}: EmptyStateProps): ReactElement {
  const hasAction = actionLabel !== undefined && onAction !== undefined;

  return (
    <View style={styles.container}>
      <Text variant="sectionTitle">{title}</Text>
      <Text tone="muted">{message}</Text>
      {hasAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.lg,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: tokens.space[3],
    padding: tokens.space[5]
  }
});
