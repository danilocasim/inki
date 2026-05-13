import type { DatabaseReader, DatabaseWriter } from "../../../lib/db";
import { nowIso } from "../../../lib/time";

export interface SettingsRepository {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
}

export const createSettingsRepository = (db: DatabaseWriter): SettingsRepository => ({
  get: (key) => getSetting(db, key),
  async set(key, value) {
    await db.runAsync(
      `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      [key, value, nowIso()]
    );
  }
});

export const getSetting = async (
  db: DatabaseReader,
  key: string
): Promise<string | undefined> => {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?;",
    [key]
  );

  return row?.value;
};
