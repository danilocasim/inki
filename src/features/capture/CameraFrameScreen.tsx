import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Screen } from "../../ui/Screen";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface CameraFrameScreenProps {
  caption: string;
  label: string;
  onManualFallback: () => void;
  title: string;
}

export function CameraFrameScreen({
  caption,
  label,
  onManualFallback,
  title
}: CameraFrameScreenProps): ReactElement {
  return (
    <Screen title={title}>
      <Card style={styles.camera} variant="ink">
        <View style={styles.frame}>
          <Text tone="inverse" variant="eyebrow">ALIGN</Text>
          <Text tone="inverse" style={styles.frameText} variant="hero">{label}</Text>
          <Text tone="inverse" variant="eyebrow">IN FRAME</Text>
        </View>
      </Card>
      <Text tone="muted">{caption}</Text>
      <Button label="manual fallback" onPress={onManualFallback} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  camera: {
    alignItems: "center",
    minHeight: 520,
    justifyContent: "center"
  },
  frame: {
    alignItems: "center",
    borderColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    gap: tokens.space[2],
    justifyContent: "center",
    minHeight: 210,
    width: "82%"
  },
  frameText: {
    letterSpacing: 3,
    textAlign: "center"
  }
});
