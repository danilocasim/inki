import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { useProfile } from "../../src/features/profile/hooks/use-profile";
import { PrivateProfileScreen } from "../../src/features/profile/PrivateProfileScreen";

export default function ProfileRoute(): ReactElement {
  const router = useRouter();
  const { error: profileError, profile, saveProfile, saving } = useProfile();

  return (
    <PrivateProfileScreen
      onOpenSettings={() => router.push("/settings")}
      onSaveProfile={saveProfile}
      profile={profile}
      profileError={profileError}
      savingProfile={saving}
    />
  );
}
