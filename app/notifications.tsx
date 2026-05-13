import type { ReactElement } from "react";

import { useNotifications } from "../src/features/notifications/hooks/use-notifications";
import { NotificationsScreen } from "../src/features/notifications/screens/NotificationsScreen";

export default function NotificationsRoute(): ReactElement {
  const { items, loading } = useNotifications();

  return <NotificationsScreen items={items} loading={loading} />;
}
