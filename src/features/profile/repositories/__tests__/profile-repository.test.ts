import type { SQLiteBindParams, SQLiteRunResult } from "expo-sqlite";

import type { DatabaseWriter } from "../../../../lib/db";
import { loadUserProfile, saveUserProfile } from "../profile-repository";

interface SettingRecord {
  key: string;
  updated_at: string;
  value: string;
}

interface FakeDb extends DatabaseWriter {
  settings: Map<string, SettingRecord>;
}

const createFakeDb = (): FakeDb => {
  const settings = new Map<string, SettingRecord>();

  return {
    settings,
    async execAsync() {
      return undefined;
    },
    async getAllAsync<T>(_source: string, params?: SQLiteBindParams): Promise<T[]> {
      const keys = Array.isArray(params) ? params.map(String) : [];

      return keys.flatMap((key) => {
        const record = settings.get(key);
        return record ? [{ key: record.key, value: record.value } as T] : [];
      });
    },
    async getFirstAsync() {
      return null;
    },
    async runAsync(_source: string, params?: SQLiteBindParams): Promise<SQLiteRunResult> {
      const args = Array.isArray(params) ? params.map(String) : [];
      const [key, value, updatedAt] = args;

      if (key !== undefined && value !== undefined && updatedAt !== undefined) {
        settings.set(key, { key, updated_at: updatedAt, value });
      }

      return { changes: 1, lastInsertRowId: 0 };
    },
    async withExclusiveTransactionAsync(task) {
      await task(this);
    },
  };
};

describe("profile repository", () => {
  it("saves profile settings with timestamps and loads them back", async () => {
    const db = createFakeDb();

    await saveUserProfile(db, {
      avatarPath: "file:///avatar.jpg",
      bio: "Shelf curator",
      displayName: "Dana",
      handle: "@dana_reads",
      readerSince: "May 2026",
    });

    expect([...db.settings.values()].every((record) => record.updated_at.length > 0)).toBe(true);

    await expect(loadUserProfile(db)).resolves.toEqual({
      avatarPath: "file:///avatar.jpg",
      bio: "Shelf curator",
      displayName: "Dana",
      handle: "@dana_reads",
      readerSince: "May 2026",
    });
  });
});
