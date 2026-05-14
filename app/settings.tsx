import type { ReactElement } from "react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useSQLiteContext } from "expo-sqlite";

import { importLibraryFromFileAsync, shareLibraryExportAsync } from "../src/features/import-export";
import { useOnboardingGate } from "../src/features/onboarding/onboarding-gate";
import { resetOnboarding } from "../src/features/onboarding/onboarding-storage";
import { SettingsScreen, type SettingsAction } from "../src/features/settings/SettingsScreen";
import { useAppSettings } from "../src/features/settings/hooks/use-app-settings";
import { eraseLocalLibraryData } from "../src/features/settings/repositories/local-data-repository";

export default function SettingsRoute(): ReactElement {
  const db = useSQLiteContext();
  const router = useRouter();
  const settings = useAppSettings();
  const { setOnboarded } = useOnboardingGate();
  const [busyAction, setBusyAction] = useState<SettingsAction | undefined>();
  const [message, setMessage] = useState<string | undefined>();

  const handleExport = async (): Promise<void> => {
    setBusyAction("export");
    setMessage(undefined);

    try {
      const result = await shareLibraryExportAsync(db);
      setMessage(`exported ${result.bookCount} books`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to export data.");
    } finally {
      setBusyAction(undefined);
    }
  };

  const handleImport = async (): Promise<void> => {
    setBusyAction("import");
    setMessage(undefined);

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: "application/json",
      });

      if (picked.canceled) {
        return;
      }

      const firstAsset = picked.assets[0];

      if (!firstAsset) {
        throw new Error("No backup file was selected.");
      }

      const result = await importLibraryFromFileAsync(db, firstAsset.uri);
      setMessage(`imported ${result.restoredRows} rows · ${result.bookCount} books`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to import data.");
    } finally {
      setBusyAction(undefined);
    }
  };

  const eraseAfterConfirmation = async (): Promise<void> => {
    setBusyAction("erase");
    setMessage(undefined);

    try {
      await eraseLocalLibraryData(db);
      setMessage("all local library data erased");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to erase data.");
    } finally {
      setBusyAction(undefined);
    }
  };

  const handleErase = (): void => {
    Alert.alert(
      "Erase all local data?",
      "This removes books, shelves, notes, quotes, bookmarks, reminders, and backups stored inside Inki. It cannot be undone.",
      [
        { style: "cancel", text: "Cancel" },
        { onPress: () => void eraseAfterConfirmation(), style: "destructive", text: "Erase" },
      ],
    );
  };

  const handleResetOnboarding = async (): Promise<void> => {
    // Send the Stack back to root before unmounting it, otherwise expo-router
    // remembers /settings and lands the user back here when onboarding finishes.
    router.replace("/");
    try {
      await resetOnboarding();
    } catch {
      // proceed even if the prefs write fails — the gate flip is what brings us back
    }
    setOnboarded(false);
  };

  return (
    <SettingsScreen
      busyAction={busyAction}
      dailyShareStreakEnabled={settings.dailyShareStreakEnabled}
      message={message}
      onEraseAllData={handleErase}
      onExportData={() => void handleExport()}
      onImportData={() => void handleImport()}
      onOpenNotifications={() => router.push("/notifications")}
      onOpenWrapped={() =>
        router.push({ pathname: "/share/[cardType]", params: { cardType: "passport" } })
      }
      onResetOnboarding={() => void handleResetOnboarding()}
      onToggleDailyShareStreak={(enabled) =>
        void settings.setBoolean("dailyShareStreakEnabled", enabled)
      }
      onToggleReadReminder={(enabled) => void settings.setBoolean("readReminderEnabled", enabled)}
      readReminderEnabled={settings.readReminderEnabled}
    />
  );
}
