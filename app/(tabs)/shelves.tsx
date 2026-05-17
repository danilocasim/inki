import type { ReactElement } from "react";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

import { ShelfOverviewScreen } from "../../src/features/shelves/ShelfOverviewScreen";
import { useCreateShelf } from "../../src/features/shelves/hooks/use-create-shelf";
import { useShelvesData } from "../../src/features/shelves/hooks/use-shelves-data";
import { TabSwipeArea } from "../../src/ui/TabSwipeArea";

export default function ShelvesRoute(): ReactElement {
  const router = useRouter();
  const createShelf = useCreateShelf();
  const { reload, shelves } = useShelvesData();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return (
    <TabSwipeArea current="shelves">
      <ShelfOverviewScreen
        shelves={shelves}
        createError={createShelf.error}
        creatingShelf={createShelf.loading}
        onCreateShelf={async (name) => {
          const shelf = await createShelf.create({ name });

          if (shelf) {
            await reload();
            router.push({ pathname: "/shelves/[id]", params: { id: shelf.id, view: "grid" } });
          }
        }}
        onOpenShelf={(shelfId) => {
          router.push({ pathname: "/shelves/[id]", params: { id: shelfId, view: "grid" } });
        }}
        onShareWall={() =>
          router.push({ pathname: "/share/[cardType]", params: { cardType: "shelf-wall" } })
        }
      />
    </TabSwipeArea>
  );
}
