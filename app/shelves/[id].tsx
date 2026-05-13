import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { isShelfView, type ShelfView } from "../../src/features/dashboard/fixtures";
import { ShelfDetailScreen } from "../../src/features/shelves/ShelfDetailScreen";
import { EmptyState } from "../../src/ui/EmptyState";
import { Screen } from "../../src/ui/Screen";

export default function ShelfDetailRoute(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[]; view?: string | string[] }>();
  const shelfId = firstParam(params.id);
  const routeView = resolveShelfView(firstParam(params.view));
  const [view, setView] = useState<ShelfView>(routeView);

  useEffect(() => {
    setView(routeView);
  }, [routeView]);

  if (!shelfId) {
    return (
      <Screen title="shelf">
        <EmptyState message="Choose a local shelf from the Shelf tab." title="No shelf selected" />
      </Screen>
    );
  }

  return (
    <ShelfDetailScreen
      shelfId={shelfId}
      view={view}
      onViewChange={(nextView) => {
        setView(nextView);
        router.setParams({ view: nextView });
      }}
    />
  );
}

const firstParam = (value: string | readonly string[] | undefined): string | undefined =>
  typeof value === "string" ? value : value?.[0];

const resolveShelfView = (value: string | undefined): ShelfView => (isShelfView(value) ? value : "grid");
