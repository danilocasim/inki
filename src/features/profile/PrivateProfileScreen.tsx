import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";

import { figmaProfile } from "../dashboard/fixtures";
import { defaultUserProfile, type UserProfile } from "./types";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { IconButton, type FeatherIconName } from "../../ui/IconButton";
import { Screen } from "../../ui/Screen";
import { StatTile } from "../../ui/StatTile";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";

export interface PrivateProfileScreenProps {
  exportingLibrary?: boolean;
  message?: string | undefined;
  onExportLibrary?: () => Promise<void> | void;
  onOpenNotifications?: () => void;
  onOpenPassport?: () => void;
  onOpenSettings: () => void;
  onOpenWrapped?: () => void;
  onSaveProfile?: (profile: UserProfile) => unknown;
  profile?: UserProfile | undefined;
  profileError?: string | undefined;
  savingProfile?: boolean;
}

/** Local-only profile/settings entry from Figma frame 4:691. */
export function PrivateProfileScreen({
  exportingLibrary = false,
  message,
  onExportLibrary = noopAsync,
  onOpenNotifications = noop,
  onOpenPassport = noop,
  onOpenSettings,
  onOpenWrapped = noop,
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

  const actionForLabel = (label: string): (() => void) => {
    if (label === "reading wrapped") {
      return onOpenWrapped;
    }

    if (label === "annual passport") {
      return onOpenPassport;
    }

    if (label === "export library") {
      return () => void onExportLibrary();
    }

    return onOpenSettings;
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="screenTitle">profile</Text>
        <View style={styles.headerActions}>
          <IconButton label="Open reading wrapped" name="share-2" onPress={onOpenWrapped} />
          <IconButton label="Open settings" name="settings" onPress={onOpenSettings} />
        </View>
      </View>

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

      <View style={styles.actionList}>
        {figmaProfile.actions.map((action, index) => (
          <ProfileActionRow
            accent={index === 0}
            detail={
              action.label === "export library" && exportingLibrary
                ? "exporting JSON backup..."
                : action.detail
            }
            disabled={action.label === "export library" && exportingLibrary}
            key={action.label}
            label={action.label}
            onPress={actionForLabel(action.label)}
          />
        ))}
        <ProfileActionRow
          accent={false}
          detail="local reminder inbox"
          label="open notifications"
          onPress={onOpenNotifications}
        />
      </View>

      {message ? (
        <Text tone="accent" style={styles.message}>
          {message}
        </Text>
      ) : null}

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

function ProfileActionRow({
  accent,
  detail,
  disabled = false,
  label,
  onPress,
}: {
  accent: boolean;
  detail: string;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
      <Card
        style={[
          styles.actionRow,
          accent ? styles.actionRowAccent : undefined,
          disabled ? styles.actionRowDisabled : undefined,
        ]}
        variant="ink"
      >
        <View style={styles.actionIcon}>
          <Feather color={tokens.color.accent} name={iconForProfileAction(label)} size={20} />
        </View>
        <View style={styles.actionCopy}>
          <Text variant="bodyStrong">{label}</Text>
          <Text tone={accent ? "accent" : "muted"} variant="bodyStrong">
            {detail}
          </Text>
        </View>
        <Feather
          color={accent ? tokens.color.accent : tokens.color.muted}
          name="chevron-right"
          size={22}
        />
      </Card>
    </Pressable>
  );
}

const iconForProfileAction = (label: string): FeatherIconName => {
  if (label === "reading wrapped") {
    return "zap";
  }

  if (label === "annual passport") {
    return "file-text";
  }

  if (label === "export library") {
    return "download";
  }

  if (label === "open notifications") {
    return "bell";
  }

  return "shield";
};

const noop = (): void => undefined;
const noopAsync = async (): Promise<void> => undefined;
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
  actionCopy: {
    flex: 1,
    gap: tokens.space[1],
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  actionList: {
    gap: tokens.space[3],
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[4],
    minHeight: 98,
  },
  actionRowAccent: {
    backgroundColor: "#4E4B86",
    borderColor: "#6C67B0",
  },
  actionRowDisabled: {
    opacity: 0.55,
  },
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
  message: {
    textAlign: "center",
  },
  multilineInput: {
    minHeight: 86,
    textAlignVertical: "top",
  },
  profileEditor: {
    gap: tokens.space[4],
  },
  content: {
    paddingBottom: tokens.space[12],
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
