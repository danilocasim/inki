import type { DatabaseReader, DatabaseWriter } from "../../../lib/db";
import { nowIso } from "../../../lib/time";
import { defaultUserProfile, type UserProfile } from "../types";

interface SettingRow {
  key: string;
  value: string;
}

const profileKeys = {
  avatarPath: "profile.avatarPath",
  bio: "profile.bio",
  displayName: "profile.displayName",
  handle: "profile.handle",
  readerSince: "profile.readerSince",
} as const;

export const loadUserProfile = async (db: DatabaseReader): Promise<UserProfile> => {
  const keys = Object.values(profileKeys);
  const placeholders = keys.map(() => "?").join(", ");
  const rows = await db.getAllAsync<SettingRow>(
    `SELECT key, value FROM app_settings WHERE key IN (${placeholders});`,
    keys,
  );
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const avatarPath = values.get(profileKeys.avatarPath);

  return {
    avatarPath: avatarPath && avatarPath.length > 0 ? avatarPath : undefined,
    bio: values.get(profileKeys.bio) ?? defaultUserProfile.bio,
    displayName: values.get(profileKeys.displayName) ?? defaultUserProfile.displayName,
    handle: values.get(profileKeys.handle) ?? defaultUserProfile.handle,
    readerSince: values.get(profileKeys.readerSince) ?? defaultUserProfile.readerSince,
  };
};

export const saveUserProfile = async (
  db: DatabaseWriter,
  profile: UserProfile,
): Promise<UserProfile> => {
  const nextProfile: UserProfile = {
    avatarPath: profile.avatarPath?.trim() || undefined,
    bio: profile.bio.trim(),
    displayName: profile.displayName.trim(),
    handle: profile.handle.trim(),
    readerSince: profile.readerSince.trim(),
  };

  await db.withExclusiveTransactionAsync(async (transaction) => {
    const entries: readonly (readonly [string, string])[] = [
      [profileKeys.avatarPath, nextProfile.avatarPath ?? ""],
      [profileKeys.bio, nextProfile.bio],
      [profileKeys.displayName, nextProfile.displayName],
      [profileKeys.handle, nextProfile.handle],
      [profileKeys.readerSince, nextProfile.readerSince],
    ];

    await Promise.all(
      entries.map(([key, value]) =>
        transaction.runAsync(
          `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
          [key, value, nowIso()],
        ),
      ),
    );
  });

  return nextProfile;
};
