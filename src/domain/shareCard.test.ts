import { describe, expect, it } from "vitest";
import { shareCardLines } from "./shareCard";

describe("shareCardLines", () => {
  it("says only minutes, Knowledge and the place, plus the title and the fan-project line", () => {
    const lines = shareCardLines({ minutes: 25, knowledge: 12, location: "Café Leblanc" });
    expect(Object.values(lines)).toEqual(["PHANTOM CORNER", "25", "minutes focused", "+12 Knowledge", "Café Leblanc", "A fan-made study room. Not affiliated with ATLUS or SEGA."]);
  });

  it("has no way to carry a name, mission or todo: its input has no such field", () => {
    const input = { minutes: 1, knowledge: 1, location: "x", mission: "SECRET", name: "SECRET" } as Parameters<typeof shareCardLines>[0];
    expect(JSON.stringify(shareCardLines(input))).not.toContain("SECRET");
  });

  it("never prints a negative, fractional or non-finite number", () => {
    expect(shareCardLines({ minutes: -3, knowledge: 4.9, location: "x" })).toMatchObject({ minutes: "0", knowledge: "+4 Knowledge" });
    expect(shareCardLines({ minutes: NaN, knowledge: Infinity, location: "x" })).toMatchObject({ minutes: "0", knowledge: "+0 Knowledge" });
  });
});
