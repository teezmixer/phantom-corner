import { describe, expect, it } from "vitest";
import { dayPartAt } from "./daynight";

const at = (h: number, m = 0) => new Date(2026, 10, 23, h, m).getTime(); // local time, as the player's clock

describe("dayPartAt", () => {
  it("is night before six and from seven in the evening, day between", () => {
    expect(dayPartAt(at(0))).toBe("night");
    expect(dayPartAt(at(5, 59))).toBe("night");
    expect(dayPartAt(at(6))).toBe("day");
    expect(dayPartAt(at(12))).toBe("day");
    expect(dayPartAt(at(18, 59))).toBe("day");
    expect(dayPartAt(at(19))).toBe("night");
    expect(dayPartAt(at(23, 59))).toBe("night");
  });
});
