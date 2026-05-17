import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { figmaProfile } from "../dashboard/fixtures";
import { defaultUserProfile, type UserProfile } from "./types";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { IconButton } from "../../ui/IconButton";
import { Screen } from "../../ui/Screen";
import { StatTile } from "../../ui/StatTile";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface PrivateProfileScreenProps {
  onOpenSettings: () => void;
  onSaveProfile?: (profile: UserProfile) => unknown;
  profile?: UserProfile | undefined;
  profileError?: string | undefined;
  savingProfile?: boolean;
}

/** Local-only profile/settings entry from Figma frame 4:691. */
export function PrivateProfileScreen({
  onOpenSettings,
  onSaveProfile = noopSaveProfile,
  profile,
  profileError,
  savingProfile = false,
}: PrivateProfileScreenProps): ReactElement {
  const activeProfile = profile ?? defaultUserProfile;
  const [editingProfile, setEditingProfile] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(activeProfile);
  const [localProfileError, setLocalProfileError] = useState<string | undefined>();

  useEffect(() => {
    if (!editingProfile) {
      setDraft(activeProfile);
    }
  }, [activeProfile, editingProfile]);

  const updateDraft = <K extends keyof UserProfile>(key: K, value: UserProfile[K]): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handlePickPhoto = async (): Promise<void> => {
    setLocalProfileError(undefined);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setLocalProfileError("Photo library access is needed to choose a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setEditingProfile(true);
      updateDraft("avatarPath", result.assets[0].uri);
    }
  };

  const handleSaveProfile = (): void => {
    const nextProfile: UserProfile = {
      avatarPath: draft.avatarPath?.trim() || undefined,
      bio: draft.bio.trim(),
      displayName: draft.displayName.trim(),
      handle: draft.handle.trim(),
      readerSince: draft.readerSince.trim(),
    };

    if (nextProfile.displayName.length === 0 || nextProfile.handle.length === 0) {
      setLocalProfileError("Display name and handle are required.");
      return;
    }

    setLocalProfileError(undefined);
    try {
      const result = onSaveProfile(nextProfile);

      if (isPromiseLike(result)) {
        void Promise.resolve(result)
          .then(() => setEditingProfile(false))
          .catch((caught: unknown) => {
            setLocalProfileError(
              caught instanceof Error ? caught.message : "Unable to save profile.",
            );
          });
        return;
      }
    } catch (caught) {
      setLocalProfileError(caught instanceof Error ? caught.message : "Unable to save profile.");
      return;
    }

    setEditingProfile(false);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="screenTitle">profile</Text>
        <View style={styles.headerActions}>
          <IconButton label="Open settings" name="settings" onPress={onOpenSettings} />
        </View>
      </View>

      <View style={styles.headerDivider} />

      <View style={styles.identityRow}>
        <View style={styles.avatarStack}>
          <View style={styles.avatar}>
            {activeProfile.avatarPath ? (
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="cover"
                source={{ uri: activeProfile.avatarPath }}
                style={styles.avatarImage}
              />
            ) : (
              <Text variant="screenTitle">{activeProfile.displayName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Pressable accessibilityRole="button" onPress={() => void handlePickPhoto()}>
            <Text tone="accent" variant="caption">
              change photo
            </Text>
          </Pressable>
        </View>
        <View style={styles.identityCopy}>
          <Text variant="screenTitle">{activeProfile.handle}</Text>
          <Text tone="muted" variant="bodyStrong">
            {activeProfile.displayName} · inki since {activeProfile.readerSince}
          </Text>
          <Text tone="muted" variant="caption">
            {activeProfile.bio}
          </Text>
          <View style={styles.badge}>
            <Text tone="muted" variant="eyebrow">
              {figmaProfile.privacyBadge}
            </Text>
          </View>
          <Button
            label="edit profile"
            onPress={() => setEditingProfile(true)}
            variant="secondary"
          />
        </View>
      </View>

      {editingProfile ? (
        <Card style={styles.profileEditor} variant="ink">
          <Text tone="muted" variant="eyebrow">
            PROFILE DETAILS
          </Text>
          <ProfileField
            label="Display name"
            onChangeText={(value) => updateDraft("displayName", value)}
            value={draft.displayName}
          />
          <ProfileField
            autoCapitalize="none"
            label="Profile handle"
            onChangeText={(value) => updateDraft("handle", value)}
            value={draft.handle}
          />
          <ProfileField
            label="Bio"
            multiline
            onChangeText={(value) => updateDraft("bio", value)}
            value={draft.bio}
          />
          <ProfileField
            label="Reader since"
            onChangeText={(value) => updateDraft("readerSince", value)}
            value={draft.readerSince}
          />
          {localProfileError || profileError ? (
            <Text tone="danger">{localProfileError ?? profileError}</Text>
          ) : null}
          <Button label="save profile" loading={savingProfile} onPress={handleSaveProfile} />
        </Card>
      ) : profileError ? (
        <Text tone="danger">{profileError}</Text>
      ) : null}

      <View style={styles.statRow}>
        {profileStats.map((stat) => (
          <StatTile detail={stat.detail} key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </View>

      <View style={styles.genresSection}>
        <Text tone="muted" variant="eyebrow">
          top genres
        </Text>
        <View style={styles.genreRow}>
          {figmaProfile.genres.map((genre) => (
            <View key={genre} style={styles.genreChip}>
              <Text variant="caption">{genre}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function ProfileField({
  autoCapitalize = "sentences",
  label,
  multiline = false,
  onChangeText,
  value,
}: {
  autoCapitalize?: "none" | "sentences" | "words";
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}): ReactElement {
  return (
    <View style={styles.field}>
      <Text tone="muted" variant="eyebrow">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={tokens.color.muted}
        style={[styles.input, multiline ? styles.multilineInput : undefined]}
        value={value}
      />
    </View>
  );
}

const noopSaveProfile = async (_profile: UserProfile): Promise<void> => undefined;
const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === "object" &&
  value !== null &&
  "then" in value &&
  typeof value.then === "function";

const profileStats = [
  { detail: "books finished", label: "books", value: "17" },
  { detail: "bookmarks", label: "bookmarks", value: "7d" },
  { detail: "reading streak", label: "streak", value: "12d" },
  { detail: "total pages", label: "pages", value: "4.8k" },
  { detail: "changed me", label: "changed", value: "5" },
] as const;

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: "#7D4C79",
    borderColor: tokens.color.accent,
    borderRadius: tokens.radius.pill,
    borderWidth: 2,
    height: 104,
    justifyContent: "center",
    overflow: "hidden",
    width: 104,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarStack: {
    alignItems: "center",
    gap: tokens.space[2],
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  genreChip: {
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[2],
    marginTop: tokens.space[3],
  },
  genresSection: {
    gap: tokens.space[3],
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    gap: tokens.space[3],
  },
  headerDivider: {
    backgroundColor: tokens.color.border,
    height: 1,
  },
  identityCopy: {
    flex: 1,
    gap: tokens.space[2],
  },
  identityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[5],
  },
  input: {
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.color.ink,
    fontFamily: tokens.typography.body.fontFamily,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[3],
  },
  multilineInput: {
    minHeight: 86,
    textAlignVertical: "top",
  },
  profileEditor: {
    gap: tokens.space[4],
  },
  content: {
    paddingBottom: 112,
  },
  field: {
    gap: tokens.space[2],
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space[3],
  },
});
