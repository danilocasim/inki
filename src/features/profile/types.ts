export interface UserProfile {
  avatarPath?: string | undefined;
  bio: string;
  displayName: string;
  handle: string;
  readerSince: string;
}

export const defaultUserProfile: UserProfile = {
  avatarPath: undefined,
  bio: "Local reader",
  displayName: "Anya",
  handle: "@anya",
  readerSince: "Jan 2026",
};
