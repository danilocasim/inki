import { fireEvent, screen } from "@testing-library/react-native";

import { DashboardScreen } from "../dashboard/DashboardScreen";
import { PrivateProfileScreen } from "../profile/PrivateProfileScreen";
import { ShelfDetailScreen } from "../shelves/ShelfDetailScreen";
import { ShelfOverviewScreen } from "../shelves/ShelfOverviewScreen";
import { renderWithProviders } from "../../test/render";

describe("static Figma screen shells", () => {
  it("renders the home dashboard labels", () => {
    renderWithProviders(<DashboardScreen />);

    expect(screen.getByText("Add Book")).toBeTruthy();
    expect(screen.getByText("The Stack")).toBeTruthy();
    expect(screen.getByText("The Pulse")).toBeTruthy();
  });

  it("renders shelf overview labels", () => {
    let openedShelf = "";

    renderWithProviders(
      <ShelfOverviewScreen
        onOpenShelf={(shelfId) => {
          openedShelf = shelfId;
        }}
      />
    );

    expect(screen.getByText("MY SHELVES — 4")).toBeTruthy();
    fireEvent.press(screen.getByText("midnight reads"));

    expect(openedShelf).toBe("midnight-reads");
  });

  it("renders the shelf detail grid shell", () => {
    renderWithProviders(
      <ShelfDetailScreen onViewChange={noop} shelfId="midnight-reads" view="grid" />
    );

    expect(screen.getByText("grid")).toBeTruthy();
    expect(screen.getByText("list")).toBeTruthy();
    expect(screen.getByText("spine")).toBeTruthy();
    expect(screen.getByText("share shelf")).toBeTruthy();
  });

  it("renders the shelf detail list and spine variants", () => {
    const listRender = renderWithProviders(
      <ShelfDetailScreen onViewChange={noop} shelfId="midnight-reads" view="list" />
    );

    expect(screen.getAllByText("Normal People").length).toBeGreaterThan(0);
    expect(screen.getByText("72%")).toBeTruthy();
    listRender.unmount();

    renderWithProviders(
      <ShelfDetailScreen onViewChange={noop} shelfId="midnight-reads" view="spine" />
    );

    expect(screen.getByText("year")).toBeTruthy();
    expect(screen.getByText("color")).toBeTruthy();
    expect(screen.getByText("genre")).toBeTruthy();
    expect(screen.getByText("author")).toBeTruthy();
  });

  it("renders private profile labels", () => {
    renderWithProviders(<PrivateProfileScreen onOpenSettings={noop} />);

    expect(screen.getByText("@anya")).toBeTruthy();
    expect(screen.getByText("local-only")).toBeTruthy();
    expect(screen.getByText("reading wrapped")).toBeTruthy();
  });
});

const noop = (): void => undefined;
