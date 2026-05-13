import type { ReactElement, ReactNode } from "react";
import { Linking, StyleSheet, View } from "react-native";

import type { PermissionState } from "./permission-state";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface PermissionGateProps {
  blockedMessage: string;
  children: ReactNode;
  deniedMessage: string;
  manualFallbackLabel: string;
  onManualFallback: () => void;
  onRequestPermission: () => void;
  state: PermissionState;
  title: string;
}

/** Keeps permission UX centralized so device prompts stay just-in-time and recoverable. */
export function PermissionGate({
  blockedMessage,
  children,
  deniedMessage,
  manualFallbackLabel,
  onManualFallback,
  onRequestPermission,
  state,
  title
}: PermissionGateProps): ReactElement {
  if (state === "granted") {
    return <>{children}</>;
  }

  if (state === "loading") {
    return (
      <Card style={styles.card} variant="elevated">
        <Text variant="sectionTitle">preparing camera</Text>
        <Text tone="muted">Checking local permission state...</Text>
      </Card>
    );
  }

  const isBlocked = state === "blocked";

  return (
    <Card style={styles.card} variant="elevated">
      <View style={styles.copy}>
        <Text variant="sectionTitle">{title}</Text>
        <Text tone="muted">{isBlocked ? blockedMessage : deniedMessage}</Text>
      </View>
      <Button
        label={isBlocked ? "open settings" : "allow camera"}
        onPress={() => {
          if (isBlocked) {
            void Linking.openSettings();
            return;
          }

          onRequestPermission();
        }}
      />
      <Button label={manualFallbackLabel} onPress={onManualFallback} variant="secondary" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.space[4]
  },
  copy: {
    gap: tokens.space[2]
  }
});
