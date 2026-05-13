import * as Sharing from "expo-sharing";

import type { DatabaseReader } from "../../../lib/db";
import { exportLibraryToFileAsync, type LibraryExportResult } from "./library-data-service";

export async function shareLibraryExportAsync(db: DatabaseReader): Promise<LibraryExportResult> {
  const result = await exportLibraryToFileAsync(db);
  const sharingAvailable = await Sharing.isAvailableAsync();

  if (sharingAvailable) {
    await Sharing.shareAsync(result.uri, {
      dialogTitle: "Export Inki data",
      mimeType: "application/json",
      UTI: "public.json",
    });
  }

  return result;
}
