export type PermissionState = "loading" | "granted" | "denied" | "blocked";

export interface PermissionSnapshot {
  canAskAgain?: boolean;
  granted: boolean;
}

/** Maps Expo permission responses to the app's explicit UX states. */
export const mapPermissionState = (permission: PermissionSnapshot | null): PermissionState => {
  if (!permission) {
    return "loading";
  }

  if (permission.granted) {
    return "granted";
  }

  return permission.canAskAgain === false ? "blocked" : "denied";
};
