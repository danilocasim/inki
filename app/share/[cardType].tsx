import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { useDashboardData } from "../../src/features/dashboard/hooks/use-dashboard-data";
import { isShareCardType } from "../../src/features/share-cards/share-card-types";
import { WrappedScreen } from "../../src/features/share-cards/screens/WrappedScreen";
import { EmptyState } from "../../src/ui/EmptyState";
import { Screen } from "../../src/ui/Screen";

export default function ShareCardRoute(): ReactElement {
  const { cardType } = useLocalSearchParams<{ cardType?: string | string[] }>();
  const value = typeof cardType === "string" ? cardType : undefined;
  const { data } = useDashboardData();

  if (!isShareCardType(value)) {
    return (
      <Screen title="share">
        <EmptyState message="This local share card is not available yet." title="Unknown card" />
      </Screen>
    );
  }

  return <WrappedScreen data={data} />;
}
