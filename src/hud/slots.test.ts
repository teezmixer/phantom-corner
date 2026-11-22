import { describe, expect, it } from "vitest";
import { DEFAULT_SLOTS, slotStyle, type WidgetId } from "./slots";

describe("slot map", () => {
  it("has a slot for every widget", () => {
    const ids: WidgetId[] = ["date", "timer", "phone", "mission", "todo", "level", "buttonBar", "music", "location"];
    expect(Object.keys(DEFAULT_SLOTS).sort()).toEqual([...ids].sort());
  });

  it("keeps every slot inside the 1440x900 reference frame", () => {
    for (const slot of Object.values(DEFAULT_SLOTS)) {
      expect(slot.x + slot.w).toBeLessThanOrEqual(1440);
      expect(slot.y + slot.h).toBeLessThanOrEqual(900);
    }
  });

  it("anchors by corner", () => {
    expect(slotStyle({ corner: "br", x: 39, y: 49, w: 10, h: 20 })).toEqual({
      position: "absolute", right: 39, bottom: 49, width: 10, height: 20,
    });
    expect(slotStyle({ corner: "tl", x: 1, y: 2, w: 3, h: 4 })).toMatchObject({ left: 1, top: 2 });
  });
});
