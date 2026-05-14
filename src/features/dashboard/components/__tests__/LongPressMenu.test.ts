import type { LayoutRectangle } from "react-native";

import { computeActionLayout } from "../LongPressMenu";

const screenWidth = 393;
const screenHeight = 852;

describe("LongPressMenu layout", () => {
  it("spaces actions across a rail above the selected book", () => {
    const tile = makeRect({ x: 146, y: 360 });
    const layout = computeActionLayout(tile, screenWidth, screenHeight);

    expect(layout.placement).toBe("above");
    expect(layout.rail.y + layout.rail.height).toBeLessThanOrEqual(tile.y - 16);
    expect(layout.actionCenters.share.x - layout.actionCenters.pin.x).toBeGreaterThanOrEqual(84);
    expect(layout.actionCenters.shelf.x - layout.actionCenters.share.x).toBeGreaterThanOrEqual(84);
  });

  it("clamps the whole action rail inside left and right screen edges", () => {
    const leftLayout = computeActionLayout(makeRect({ x: 20, y: 320 }), screenWidth, screenHeight);
    const rightLayout = computeActionLayout(
      makeRect({ x: 276, y: 320 }),
      screenWidth,
      screenHeight,
    );

    expect(leftLayout.rail.x).toBeGreaterThanOrEqual(16);
    expect(rightLayout.rail.x + rightLayout.rail.width).toBeLessThanOrEqual(screenWidth - 16);
  });

  it("moves actions below when the selected book is near the top edge", () => {
    const tile = makeRect({ x: 146, y: 38 });
    const layout = computeActionLayout(tile, screenWidth, screenHeight);

    expect(layout.placement).toBe("below");
    expect(layout.rail.y).toBeGreaterThanOrEqual(tile.y + tile.height + 16);
  });
});

const makeRect = ({ x, y }: Pick<LayoutRectangle, "x" | "y">): LayoutRectangle => ({
  height: 150,
  width: 100,
  x,
  y,
});
