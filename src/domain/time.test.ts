import { describe, expect, it } from "vitest";
import { dayPart } from "./time";

const at = (h: number) => new Date(2026, 10, 22, h, 0);

describe("dayPart", () => {
  it.each([
    [4, "Night"], [5, "Morning"], [10, "Morning"], [11, "Daytime"], [16, "Daytime"],
    [17, "Evening"], [20, "Evening"], [21, "Night"], [0, "Night"],
  ])("%i:00 → %s", (h, part) => expect(dayPart(at(h))).toBe(part));
});
