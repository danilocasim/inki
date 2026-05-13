import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { createSettingsRepository } from "../repositories/settings-repository";

export interface AppSettingsState {
  dailyShareStreakEnabled: boolean;
  iCloudSyncEnabled: boolean;
  loading: boolean;
  readReminderEnabled: boolean;
  reload: () => Promise<void>;
  setBoolean: (key: AppSettingBooleanKey, value: boolean) => Promise<void>;
}

export type AppSettingBooleanKey = "dailyShareStreakEnabled" | "iCloudSyncEnabled" | "readReminderEnabled";

const defaults: Record<AppSettingBooleanKey, boolean> = {
  dailyShareStreakEnabled: true,
  iCloudSyncEnabled: false,
  readReminderEnabled: false
};

export function useAppSettings(): AppSettingsState {
  const db = useSQLiteContext();
  const [values, setValues] = useState<Record<AppSettingBooleanKey, boolean>>(defaults);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const repository = createSettingsRepository(db);
      const entries = await Promise.all(
        settingKeys.map(async (key) => [key, parseBoolean(await repository.get(key), defaults[key])] as const)
      );

      setValues(Object.fromEntries(entries) as Record<AppSettingBooleanKey, boolean>);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const setBoolean = useCallback(
    async (key: AppSettingBooleanKey, value: boolean): Promise<void> => {
      await createSettingsRepository(db).set(key, value ? "true" : "false");
      setValues((current) => ({ ...current, [key]: value }));
    },
    [db]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    dailyShareStreakEnabled: values.dailyShareStreakEnabled,
    iCloudSyncEnabled: values.iCloudSyncEnabled,
    loading,
    readReminderEnabled: values.readReminderEnabled,
    reload,
    setBoolean
  };
}

const settingKeys: readonly AppSettingBooleanKey[] = [
  "dailyShareStreakEnabled",
  "iCloudSyncEnabled",
  "readReminderEnabled"
];

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
};
