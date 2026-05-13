import type { ReactElement } from "react";
import { useState } from "react";
import { CameraView, type BarcodeScanningResult, type BarcodeType, useCameraPermissions } from "expo-camera";
import { StyleSheet, View } from "react-native";

import { getIsbnFromBarcode } from "../services/isbn-service";
import { mapPermissionState, PermissionGate } from "../../../lib/permissions";
import { Button } from "../../../ui/Button";
import { Card } from "../../../ui/Card";
import { Screen } from "../../../ui/Screen";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface BarcodeScanScreenProps {
  onIsbnScanned: (isbn: string) => void;
  onManualFallback: () => void;
}

const isbnBarcodeTypes: BarcodeType[] = ["ean13"];

export function BarcodeScanScreen({
  onIsbnScanned,
  onManualFallback
}: BarcodeScanScreenProps): ReactElement {
  const [permission, requestPermission] = useCameraPermissions();
  const [feedback, setFeedback] = useState("Align the ISBN barcode on the back cover.");
  const [hasScanned, setHasScanned] = useState(false);
  const permissionState = mapPermissionState(permission);

  const handleBarcodeScanned = (result: BarcodeScanningResult): void => {
    if (hasScanned) {
      return;
    }

    const isbn = getIsbnFromBarcode(result);

    if (!isbn) {
      setFeedback("That barcode is not a valid book ISBN. Try the EAN-13 barcode or enter it manually.");
      return;
    }

    setHasScanned(true);
    setFeedback(`Found ISBN ${isbn}. Opening editable book draft...`);
    onIsbnScanned(isbn);
  };

  return (
    <Screen title="scan barcode">
      <PermissionGate
        blockedMessage="Camera access is blocked. Enable it in system settings, or add the book manually."
        deniedMessage="Inki uses the camera only to scan local ISBN barcodes. Manual entry works offline."
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
            barcodeScannerSettings={{ barcodeTypes: isbnBarcodeTypes }}
            facing="back"
            onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
            onMountError={() => setFeedback("Camera failed to start. You can still enter the ISBN manually.")}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.frame}>
            <Text tone="inverse" variant="eyebrow">ALIGN</Text>
            <Text tone="inverse" style={styles.frameText} variant="hero">BARCODE</Text>
            <Text tone="inverse" variant="eyebrow">IN FRAME</Text>
          </View>
        </Card>
        <Text tone="muted">{feedback}</Text>
        <Text tone="muted" variant="caption">
          Open Library lookup is optional; scanned ISBNs always open an editable offline draft.
        </Text>
        <Button label="enter manually" onPress={onManualFallback} variant="secondary" />
      </PermissionGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  camera: {
    alignItems: "center",
    minHeight: 520,
    justifyContent: "center",
    overflow: "hidden"
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
