import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { ShelfOverviewScreen } from "../../src/features/shelves/ShelfOverviewScreen";

export default function ShelvesRoute(): ReactElement {
  const router = useRouter();

  return (
    <ShelfOverviewScreen
      onOpenShelf={(shelfId) => {
        router.push({ pathname: "/shelves/[id]", params: { id: shelfId, view: "grid" } });
      }}
    />
  );
}
