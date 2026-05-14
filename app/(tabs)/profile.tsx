import type { ReactElement } from "react";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { shareLibraryExportAsync } from "../../src/features/import-export";
import { useProfile } from "../../src/features/profile/hooks/use-profile";
import { PrivateProfileScreen } from "../../src/features/profile/PrivateProfileScreen";

export default function ProfileRoute(): ReactElement {
  const db = useSQLiteContext();
  const router = useRouter();
  const [exportingLibrary, setExportingLibrary] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const { error: profileError, profile, saveProfile, saving } = useProfile();

  const handleExportLibrary = async (): Promise<void> => {
    setExportingLibrary(true);
    setMessage(undefined);

    try {
      const result = await shareLibraryExportAsync(db);
      setMessage(`exported ${result.bookCount} books`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to export data.");
    } finally {
      setExportingLibrary(false);
    }
  };

  return (
    <PrivateProfileScreen
      exportingLibrary={exportingLibrary}
      message={message}
      onExportLibrary={handleExportLibrary}
      onOpenNotifications={() => router.push("/notifications")}
      onOpenPassport={() =>
        router.push({ pathname: "/share/[cardType]", params: { cardType: "passport" } })
      }
      onOpenSettings={() => router.push("/settings")}
      onOpenWrapped={() =>
        router.push({ pathname: "/share/[cardType]", params: { cardType: "wrapped" } })
      }
      onSaveProfile={saveProfile}
      profile={profile}
      profileError={profileError}
      savingProfile={saving}
    />
  );
}
