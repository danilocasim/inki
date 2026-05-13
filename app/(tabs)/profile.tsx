import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { PrivateProfileScreen } from "../../src/features/profile/PrivateProfileScreen";

export default function ProfileRoute(): ReactElement {
  const router = useRouter();

  return (
    <PrivateProfileScreen
      onOpenNotifications={() => router.push("/notifications")}
      onOpenSettings={() => router.push("/settings")}
      onOpenWrapped={() => router.push({ pathname: "/share/[cardType]", params: { cardType: "wrapped" } })}
    />
  );
}
