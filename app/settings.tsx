import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { SettingsScreen } from "../src/features/settings/SettingsScreen";

export default function SettingsRoute(): ReactElement {
  const router = useRouter();

  return (
    <SettingsScreen
      onOpenNotifications={() => router.push("/notifications")}
      onOpenWrapped={() => router.push({ pathname: "/share/[cardType]", params: { cardType: "wrapped" } })}
    />
  );
}
