import { describe, expect, it } from "vitest";
import { computeHudScale, MAX_HUD_SCALE } from "./useHudScale";

describe("computeHudScale", () => {
  it.each([
    [1440, 900, 1],
    [1024, 600, 600 / 900], // height-bound: the smaller ratio wins
    [2560, 1440, 1440 / 900],
    [1920, 900, 1], // wide screen: height limits
  ])("%ix%i → %f", (w, h, expected) => {
    expect(computeHudScale(w, h)).toBeCloseTo(expected, 5);
  });

  it("caps at the 3x export resolution on very large screens", () => {
    expect(computeHudScale(8000, 5000)).toBe(MAX_HUD_SCALE);
  });
});
