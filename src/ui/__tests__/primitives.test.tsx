import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "../../test/render";
import { Button } from "../Button";
import { ErrorState } from "../ErrorState";
import { SegmentedControl } from "../SegmentedControl";
import { StatTile } from "../StatTile";
import { Text } from "../Text";

describe("ui primitives", () => {
  it("renders text through the shared type scale", () => {
    renderWithProviders(<Text variant="sectionTitle">The Stack</Text>);

    expect(screen.getByText("The Stack")).toBeTruthy();
  });

  it("calls button actions", () => {
    let presses = 0;

    renderWithProviders(<Button label="Add Book" onPress={() => presses += 1} />);
    fireEvent.press(screen.getByRole("button", { name: "Add Book" }));

    expect(presses).toBe(1);
  });

  it("changes segmented control state", () => {
    let selected = "grid";

    renderWithProviders(
      <SegmentedControl
        onValueChange={(value) => {
          selected = value;
        }}
        options={[
          { label: "grid", value: "grid" },
          { label: "list", value: "list" },
          { label: "spine", value: "spine" }
        ]}
        value="grid"
      />
    );

    fireEvent.press(screen.getByText("spine"));

    expect(selected).toBe("spine");
  });

  it("renders stat tiles", () => {
    renderWithProviders(<StatTile detail="days alive" label="continuity" value="8" />);

    expect(screen.getByText("continuity")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy();
  });

  it("calls error recovery actions", () => {
    let recovered = false;

    renderWithProviders(
      <ErrorState
        actionLabel="Try again"
        message="The local route failed."
        onAction={() => {
          recovered = true;
        }}
        title="Inki hit a local error"
      />
    );

    fireEvent.press(screen.getByText("Try again"));

    expect(recovered).toBe(true);
  });
});
