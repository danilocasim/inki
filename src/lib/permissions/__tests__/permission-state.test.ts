import { mapPermissionState } from "../permission-state";

describe("permission state mapping", () => {
  it("maps missing permissions to loading", () => {
    expect(mapPermissionState(null)).toBe("loading");
  });

  it("maps granted permissions", () => {
    expect(mapPermissionState({ canAskAgain: true, granted: true })).toBe("granted");
  });

  it("distinguishes denied from blocked", () => {
    expect(mapPermissionState({ canAskAgain: true, granted: false })).toBe("denied");
    expect(mapPermissionState({ canAskAgain: false, granted: false })).toBe("blocked");
  });
});
