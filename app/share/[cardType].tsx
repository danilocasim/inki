import { useState, type ReactElement, type RefObject } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useSQLiteContext } from "expo-sqlite";
import { captureRef } from "react-native-view-shot";

import { useDashboardData } from "../../src/features/dashboard/hooks/use-dashboard-data";
import { recordShareEvent } from "../../src/features/share-cards";
import { isShareCardType } from "../../src/features/share-cards/share-card-types";
import { WrappedScreen } from "../../src/features/share-cards/screens/WrappedScreen";
import { EmptyState } from "../../src/ui/EmptyState";
import { Screen } from "../../src/ui/Screen";

export default function ShareCardRoute(): ReactElement {
  const db = useSQLiteContext();
  const router = useRouter();
  const { cardType } = useLocalSearchParams<{ cardType?: string | string[] }>();
  const value = typeof cardType === "string" ? cardType : undefined;
  const { data } = useDashboardData();
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | undefined>();

  if (!isShareCardType(value)) {
    return (
      <Screen title="share">
        <EmptyState message="This local share card is not available yet." title="Unknown card" />
      </Screen>
    );
  }

  const handleShareCard = async (cardRef: RefObject<View | null>): Promise<void> => {
    if (!cardRef.current) {
      setShareMessage("share card is not ready yet");
      return;
    }

    setShareLoading(true);
    setShareMessage(undefined);

    try {
      const outputPath = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile"
      });
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (sharingAvailable) {
        await Sharing.shareAsync(outputPath, {
          dialogTitle: "Share Inki card",
          mimeType: "image/png",
          UTI: "public.png"
        });
      }

      await recordShareEvent(db, {
        cardType: value,
        outputPath,
        usedForStreak: value === "wrapped"
      });
      setShareMessage("share card saved");
    } catch (caught) {
      setShareMessage(caught instanceof Error ? caught.message : "Unable to share this card.");
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <WrappedScreen
      cardType={value}
      data={data}
      onClose={() => router.back()}
      onShareCard={handleShareCard}
      shareLoading={shareLoading}
      shareMessage={shareMessage}
    />
  );
}
