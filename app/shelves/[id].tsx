import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { isShelfView, type ShelfView } from "../../src/features/dashboard/fixtures";
import { createSettingsRepository } from "../../src/features/settings/repositories/settings-repository";
import { useShelfDetail } from "../../src/features/shelves/hooks/use-shelf-detail";
import { ShelfDetailScreen } from "../../src/features/shelves/ShelfDetailScreen";
import { EmptyState } from "../../src/ui/EmptyState";
import { Screen } from "../../src/ui/Screen";

export default function ShelfDetailRoute(): ReactElement {
  const db = useSQLiteContext();
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
    <ShelfDetailContainer
      onOpenBook={(bookId) => router.push({ pathname: "/book/[id]", params: { id: bookId } })}
      onShareShelf={() =>
        router.push({
          pathname: "/share/[cardType]",
          params: { cardType: "shelf-wall", sourceId: shelfId },
        })
      }
      onViewChange={(nextView) => {
        setView(nextView);
        router.setParams({ view: nextView });
        void createSettingsRepository(db).set(`shelfView.${shelfId}`, nextView);
      }}
      shelfId={shelfId}
      view={view}
    />
  );
}

function ShelfDetailContainer({
  onOpenBook,
  onShareShelf,
  onViewChange,
  shelfId,
  view,
}: {
  onOpenBook: (bookId: string) => void;
  onShareShelf: () => void;
  onViewChange: (view: ShelfView) => void;
  shelfId: string;
  view: ShelfView;
}): ReactElement {
  const { shelf } = useShelfDetail(shelfId);

  return (
    <ShelfDetailScreen
      onOpenBook={onOpenBook}
      onShareShelf={onShareShelf}
      onViewChange={onViewChange}
      shelf={shelf}
      shelfId={shelfId}
      view={view}
    />
  );
}

const firstParam = (value: string | readonly string[] | undefined): string | undefined =>
  typeof value === "string" ? value : value?.[0];

const resolveShelfView = (value: string | undefined): ShelfView =>
  isShelfView(value) ? value : "grid";
