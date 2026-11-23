import { describe, expect, it } from "vitest";
import { MAX_STAMPED_DAYS, dayKey, isStudied, monthGrid, repairStampedDays, shiftMonth, stampDay, stampStyleFor, type StampedDay } from "./calendar";

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime();

describe("dayKey", () => {
  it("is the local calendar date, zero-padded", () => {
    expect(dayKey(at(2026, 0, 5))).toBe("2026-01-05");
    expect(dayKey(at(2026, 10, 23))).toBe("2026-11-23");
  });
  it("a late evening and an early morning are different days", () => {
    expect(dayKey(new Date(2026, 10, 23, 23, 59).getTime())).toBe("2026-11-23");
    expect(dayKey(new Date(2026, 10, 24, 0, 1).getTime())).toBe("2026-11-24");
  });
});

describe("isStudied", () => {
  const session = (focusedMin: number, outcome: "completed" | "stopped") => ({ kind: "session", plannedMs: 25 * 60_000, focusedMs: focusedMin * 60_000, outcome }) as const;
  it.each([
    ["a finished session", session(25, "completed"), true],
    ["a cut-short session of exactly 5 minutes", session(5, "stopped"), true],
    ["a cut-short session under 5 minutes", session(4, "stopped"), false],
    ["a mission being written", { kind: "mission_first_set" } as const, false],
    ["a dev grant", { kind: "dev_grant", knowledge: 50 } as const, false],
  ])("%s", (_name, event, expected) => expect(isStudied(event)).toBe(expected));
});

describe("stampDay", () => {
  it("adds a day with the stamp design current at the time", () => {
    expect(stampDay([], at(2026, 10, 23), 2)).toEqual([{ day: "2026-11-23", style: 2 }]);
  });
  it("a day keeps its first stamp, and the list is returned unchanged", () => {
    const first = stampDay([], at(2026, 10, 23), 0);
    expect(stampDay(first, at(2026, 10, 23, 20), 3)).toBe(first);
  });
  it("two sessions on one day stamp it once; another day adds one", () => {
    let days = stampDay([], at(2026, 10, 23, 9), 0);
    days = stampDay(days, at(2026, 10, 23, 18), 0);
    days = stampDay(days, at(2026, 10, 24, 9), 0);
    expect(days.map((d) => d.day)).toEqual(["2026-11-23", "2026-11-24"]);
  });
});

describe("stampDay keeps the list in date order and trims by date", () => {
  const full = (): StampedDay[] => Array.from({ length: MAX_STAMPED_DAYS }, (_, i) => ({ day: dayKey(new Date(2020, 0, 1 + i).getTime()), style: 0 }));

  it("inserts an earlier day in its place, not at the end", () => {
    const days = stampDay([{ day: "2026-11-20", style: 0 }], at(2026, 10, 10), 0);
    expect(days.map((d) => d.day)).toEqual(["2026-11-10", "2026-11-20"]);
  });

  it("when full, a newer day pushes out the oldest DATE", () => {
    const days = stampDay(full(), at(2040, 5, 1), 0);
    expect(days).toHaveLength(MAX_STAMPED_DAYS);
    expect(days[0]!.day).toBe("2020-01-02"); // 2020-01-01 went
    expect(days.at(-1)!.day).toBe("2040-06-01");
  });

  it("when full, a stamp from a wrong clock far in the past does not displace a real day, and does not stay", () => {
    const base = full();
    const days = stampDay(base, at(1999, 0, 1), 0);
    expect(days).toHaveLength(MAX_STAMPED_DAYS);
    expect(days.some((d) => d.day === "1999-01-01")).toBe(false);
    expect(days[0]!.day).toBe("2020-01-01");
  });
});

describe("repairStampedDays", () => {
  it("returns the days in date order, whatever order they were stored in", () => {
    expect(repairStampedDays([{ day: "2026-11-22", style: 0 }, { day: "2026-11-02", style: 1 }]).map((d) => d.day)).toEqual(["2026-11-02", "2026-11-22"]);
  });
});

describe("stampStyleFor", () => {
  it.each([[1, 0], [3, 0], [4, 1], [9, 1], [10, 2], [15, 3], [19, 4], [23, 5], [29, 5]])("level %i uses design %i", (level, style) => expect(stampStyleFor(level)).toBe(style));
});

describe("monthGrid", () => {
  it("lays November 2026 out Monday first: the 1st is a Sunday, so six empty cells come before it", () => {
    const grid = monthGrid(2026, 10);
    expect(grid[0]).toEqual([null, null, null, null, null, null, 1]);
    expect(grid.flat().filter((d) => d !== null)).toHaveLength(30);
    expect(grid.every((w) => w.length === 7)).toBe(true);
  });
  it("a month that starts on a Monday has no leading padding", () => {
    expect(monthGrid(2026, 5)[0]![0]).toBe(1); // 1 June 2026 is a Monday
  });
  it("handles February in a leap year", () => {
    expect(monthGrid(2028, 1).flat().filter((d) => d !== null)).toHaveLength(29);
  });
});

describe("shiftMonth", () => {
  it("moves across year ends in both directions", () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 5, 0)).toEqual({ year: 2026, month: 5 });
    expect(shiftMonth(2026, 10, -23)).toEqual({ year: 2024, month: 11 });
  });
});
