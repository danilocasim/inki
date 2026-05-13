import type { ReactElement } from "react";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

import { ShelfOverviewScreen } from "../../src/features/shelves/ShelfOverviewScreen";
import { useShelvesData } from "../../src/features/shelves/hooks/use-shelves-data";

export default function ShelvesRoute(): ReactElement {
  const router = useRouter();
  const { reload, shelves } = useShelvesData();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return (
    <ShelfOverviewScreen
      shelves={shelves}
      onOpenShelf={(shelfId) => {
        router.push({ pathname: "/shelves/[id]", params: { id: shelfId, view: "grid" } });
      }}
    />
  );
}
