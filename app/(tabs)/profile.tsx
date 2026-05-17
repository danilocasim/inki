import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { useProfile } from "../../src/features/profile/hooks/use-profile";
import { PrivateProfileScreen } from "../../src/features/profile/PrivateProfileScreen";
import { TabSwipeArea } from "../../src/ui/TabSwipeArea";

export default function ProfileRoute(): ReactElement {
  const router = useRouter();
  const { error: profileError, profile, saveProfile, saving } = useProfile();

  return (
    <TabSwipeArea current="profile">
      <PrivateProfileScreen
        onOpenSettings={() => router.push("/settings")}
        onSaveProfile={saveProfile}
        profile={profile}
        profileError={profileError}
        savingProfile={saving}
      />
    </TabSwipeArea>
  );
}
