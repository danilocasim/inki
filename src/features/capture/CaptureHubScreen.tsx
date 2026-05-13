import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Screen } from "../../ui/Screen";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface CaptureHubScreenProps {
  onCaptureQuote: () => void;
  onScanIsbn: () => void;
}

export function CaptureHubScreen({
  onCaptureQuote,
  onScanIsbn
}: CaptureHubScreenProps): ReactElement {
  return (
    <Screen title="capture">
      <View style={styles.cards}>
        <Card style={styles.card} variant="ink">
          <Text tone="inverse" variant="sectionTitle">scan ISBN</Text>
          <Text tone="inverse">add a book by barcode</Text>
          <Button label="scan →" onPress={onScanIsbn} variant="secondary" />
        </Card>
        <Card style={styles.card} variant="elevated">
          <Text variant="sectionTitle">capture quote</Text>
          <Text tone="muted">OCR a page from a physical book</Text>
          <Text tone="muted" variant="caption">fully offline • processed on device</Text>
          <Button label="capture →" onPress={onCaptureQuote} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.space[3],
    minHeight: 180,
    justifyContent: "space-between"
  },
  cards: {
    gap: tokens.space[4]
  }
});
