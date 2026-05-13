import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { PrivateProfileScreen } from "../../src/features/profile/PrivateProfileScreen";

export default function ProfileRoute(): ReactElement {
  const router = useRouter();

  return <PrivateProfileScreen onOpenSettings={() => router.push("/settings")} />;
}
