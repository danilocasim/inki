import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { useNotifications } from "../src/features/notifications/hooks/use-notifications";
import { NotificationsScreen } from "../src/features/notifications/screens/NotificationsScreen";

export default function NotificationsRoute(): ReactElement {
  const router = useRouter();
  const { items, loading, markRead } = useNotifications();

  return (
    <NotificationsScreen
      items={items}
      loading={loading}
      onClose={() => router.back()}
      onOpenItem={(item) => {
        void markRead(item.id);

        if (item.type === "share-streak" || item.type === "wrapped") {
          router.push({ pathname: "/share/[cardType]", params: { cardType: "wrapped" } });
        }
      }}
    />
  );
}
