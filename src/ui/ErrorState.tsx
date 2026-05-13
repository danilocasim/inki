import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "./Button";
import { Text } from "./Text";
import { tokens } from "./tokens";

export interface ErrorStateProps {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  title: string;
}

/** Local recovery surface for route-level errors without destructive reset flows. */
export function ErrorState({
  actionLabel,
  message,
  onAction,
  title
}: ErrorStateProps): ReactElement {
  const hasAction = actionLabel !== undefined && onAction !== undefined;

  return (
    <View style={styles.container}>
      <Text tone="danger" variant="eyebrow">
        local error
      </Text>
      <Text variant="sectionTitle">{title}</Text>
      <Text tone="muted">{message}</Text>
      {hasAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.danger,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    gap: tokens.space[3],
    margin: tokens.space[5],
    padding: tokens.space[5]
  }
});
