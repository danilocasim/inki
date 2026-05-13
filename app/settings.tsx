import type { ReactElement } from "react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { useSQLiteContext } from "expo-sqlite";

import {
  exportLibraryToFileAsync,
  importLibraryFromFileAsync
} from "../src/features/import-export";
import { SettingsScreen, type SettingsAction } from "../src/features/settings/SettingsScreen";
import { useAppSettings } from "../src/features/settings/hooks/use-app-settings";
import { eraseLocalLibraryData } from "../src/features/settings/repositories/local-data-repository";

export default function SettingsRoute(): ReactElement {
  const db = useSQLiteContext();
  const router = useRouter();
  const settings = useAppSettings();
  const [busyAction, setBusyAction] = useState<SettingsAction | undefined>();
  const [message, setMessage] = useState<string | undefined>();

  const handleExport = async (): Promise<void> => {
    setBusyAction("export");
    setMessage(undefined);

    try {
      const result = await exportLibraryToFileAsync(db);
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (sharingAvailable) {
        await Sharing.shareAsync(result.uri, {
          dialogTitle: "Export Inki data",
          mimeType: "application/json",
          UTI: "public.json"
        });
      }

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
        type: "application/json"
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
        { onPress: () => void eraseAfterConfirmation(), style: "destructive", text: "Erase" }
      ]
    );
  };

  return (
    <SettingsScreen
      busyAction={busyAction}
      dailyShareStreakEnabled={settings.dailyShareStreakEnabled}
      iCloudSyncEnabled={settings.iCloudSyncEnabled}
      message={message}
      onEraseAllData={handleErase}
      onExportData={() => void handleExport()}
      onImportData={() => void handleImport()}
      onOpenNotifications={() => router.push("/notifications")}
      onOpenWrapped={() => router.push({ pathname: "/share/[cardType]", params: { cardType: "passport" } })}
      onToggleDailyShareStreak={(enabled) => void settings.setBoolean("dailyShareStreakEnabled", enabled)}
      onToggleICloudSync={(enabled) => void settings.setBoolean("iCloudSyncEnabled", enabled)}
      onToggleReadReminder={(enabled) => void settings.setBoolean("readReminderEnabled", enabled)}
      readReminderEnabled={settings.readReminderEnabled}
    />
  );
}
