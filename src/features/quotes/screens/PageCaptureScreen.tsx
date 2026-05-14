import type { ReactElement } from "react";
import { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { mapPermissionState, PermissionGate } from "../../../lib/permissions";
import { Button } from "../../../ui/Button";
import { Card } from "../../../ui/Card";
import { Screen } from "../../../ui/Screen";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface PageCaptureScreenProps {
  onBack?: () => void;
  onCaptured: (photoUri: string) => void;
  onManualFallback: () => void;
}

export function PageCaptureScreen({
  onBack,
  onCaptured,
  onManualFallback,
}: PageCaptureScreenProps): ReactElement {
  const [permission, requestPermission] = useCameraPermissions();
  const [feedback, setFeedback] = useState(
    "Frame the page so the lines you want to capture sit inside the box.",
  );
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const permissionState = mapPermissionState(permission);

  const handleCapture = async (): Promise<void> => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    setFeedback("Capturing…");
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        onCaptured(photo.uri);
      } else {
        setFeedback("Capture failed. Try again or enter the quote manually.");
      }
    } catch {
      setFeedback("Capture failed. Try again or enter the quote manually.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      {onBack ? (
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            style={styles.backBtn}
          >
            <Feather color={tokens.color.inkSoft} name="arrow-left" size={20} />
          </Pressable>
          <Text variant="screenTitle">scan a line</Text>
        </View>
      ) : (
        <Text variant="screenTitle">scan a line</Text>
      )}
      <PermissionGate
        blockedMessage="Camera access is blocked. Enable it in system settings, or enter the quote manually."
        deniedMessage="Inki uses the camera only to capture page text on-device. Manual entry works offline."
        manualFallbackLabel="enter manually"
        onManualFallback={onManualFallback}
        onRequestPermission={() => {
          void requestPermission();
        }}
        state={permissionState}
        title="camera permission"
      >
        <Card style={styles.camera} variant="ink">
          <CameraView
            ref={cameraRef}
            facing="back"
            onMountError={() =>
              setFeedback("Camera failed to start. You can still enter the quote manually.")
            }
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.frame}>
            <Text tone="inverse" variant="eyebrow">
              ALIGN
            </Text>
            <Text style={styles.frameText} tone="inverse" variant="hero">
              PAGE
            </Text>
            <Text tone="inverse" variant="eyebrow">
              IN FRAME
            </Text>
          </View>
        </Card>
        <Text tone="muted">{feedback}</Text>
        <Button
          label={capturing ? "capturing…" : "capture page"}
          loading={capturing}
          onPress={() => void handleCapture()}
        />
        <Button label="enter manually" onPress={onManualFallback} variant="secondary" />
      </PermissionGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  camera: {
    alignItems: "center",
    backgroundColor: tokens.color.black,
    justifyContent: "center",
    minHeight: 480,
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: tokens.space[3],
    paddingTop: tokens.space[6],
  },
  frame: {
    alignItems: "center",
    borderColor: tokens.color.accent,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    gap: tokens.space[2],
    justifyContent: "center",
    minHeight: 240,
    width: "82%",
  },
  frameText: {
    letterSpacing: 3,
    textAlign: "center",
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[3],
  },
});
