import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "../../test/render";
import { PrivateProfileScreen } from "../profile/PrivateProfileScreen";
import { SettingsScreen } from "../settings/SettingsScreen";
import { WrappedScreen } from "../share-cards/screens/WrappedScreen";
import { ShelfDetailScreen } from "../shelves/ShelfDetailScreen";

describe("feature interactions", () => {
  it("removes iCloud sync from settings", () => {
    renderWithProviders(<SettingsScreen />);

    expect(screen.queryByText("iCloud sync")).toBeNull();
    expect(screen.getByText("export all data")).toBeTruthy();
  });

  it("routes profile rows to their concrete feature actions", () => {
    const opened: string[] = [];

    renderWithProviders(
      <PrivateProfileScreen
        onExportLibrary={() => {
          opened.push("export");
        }}
        onOpenNotifications={() => opened.push("notifications")}
        onOpenPassport={() => opened.push("passport")}
        onOpenSettings={() => opened.push("settings")}
        onOpenWrapped={() => opened.push("wrapped")}
      />,
    );

    fireEvent.press(screen.getByText("reading wrapped"));
    fireEvent.press(screen.getByText("annual passport"));
    fireEvent.press(screen.getByText("export library"));
    fireEvent.press(screen.getByText("open notifications"));

    expect(opened).toEqual(["wrapped", "passport", "export", "notifications"]);
  });

  it("supports explicit wrapped card previous and next navigation", () => {
    renderWithProviders(<WrappedScreen />);

    expect(screen.getByText("books read")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Next share card"));
    expect(screen.getByText("midnight")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Previous share card"));
    expect(screen.getByText("books read")).toBeTruthy();
  });

  it("shares shelves and lets spine titles be selected", () => {
    let shared = false;

    renderWithProviders(
      <ShelfDetailScreen
        onShareShelf={() => {
          shared = true;
        }}
        onViewChange={noop}
        shelfId="midnight-reads"
        view="spine"
      />,
    );

    fireEvent.press(screen.getByLabelText("Select Piranesi"));
    expect(screen.getAllByText("Piranesi").length).toBeGreaterThan(0);

    fireEvent.press(screen.getByText("share shelf"));
    expect(shared).toBe(true);
  });
});

const noop = (): void => undefined;
