import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "../../ui/Card";
import { IconButton } from "../../ui/IconButton";
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
    <Screen contentStyle={styles.content} title="capture">
      <View style={styles.cards}>
        <Card style={styles.card} variant="ink">
          <View style={styles.iconBadge}>
            <Feather color={tokens.color.accent} name="hash" size={24} />
          </View>
          <View style={styles.cardCopy}>
            <Text variant="sectionTitle">scan ISBN</Text>
            <Text tone="muted">add a book by barcode</Text>
          </View>
          <IconButton label="Scan ISBN" name="arrow-right" onPress={onScanIsbn} variant="ghost" />
        </Card>
        <Card style={styles.card} variant="ink">
          <View style={styles.iconBadge}>
            <Feather color={tokens.color.accent} name="file-text" size={24} />
          </View>
          <View style={styles.cardCopy}>
            <Text variant="sectionTitle">capture quote</Text>
            <Text tone="muted">OCR a page from a physical book</Text>
          </View>
          <IconButton label="Capture quote" name="arrow-right" onPress={onCaptureQuote} variant="ghost" />
        </Card>
      </View>
      <Text tone="muted" style={styles.footer} variant="caption">
        fully offline · processed on-device
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[4],
    minHeight: 116
  },
  cardCopy: {
    flex: 1,
    gap: tokens.space[1]
  },
  cards: {
    gap: tokens.space[4]
  },
  content: {
    paddingTop: tokens.space[8]
  },
  footer: {
    marginTop: tokens.space[6],
    textAlign: "center"
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    height: 62,
    justifyContent: "center",
    width: 62
  }
});
