import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { loadUserProfile, saveUserProfile } from "../repositories/profile-repository";
import { defaultUserProfile, type UserProfile } from "../types";

interface UseProfileResult {
  error: string | undefined;
  loading: boolean;
  profile: UserProfile;
  reload: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  saving: boolean;
}

export const useProfile = (): UseProfileResult => {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(undefined);

    try {
      setProfile(await loadUserProfile(db));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSaveProfile = useCallback(
    async (nextProfile: UserProfile): Promise<void> => {
      setSaving(true);
      setError(undefined);

      try {
        setProfile(await saveUserProfile(db, nextProfile));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to save profile.");
        throw caught;
      } finally {
        setSaving(false);
      }
    },
    [db],
  );

  return {
    error,
    loading,
    profile,
    reload,
    saveProfile: handleSaveProfile,
    saving,
  };
};
