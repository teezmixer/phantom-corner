import { describe, expect, it } from "vitest";
import { countdown, deadlineFromInput, inputFromDeadline } from "./deadline";

const NOW = Date.UTC(2026, 10, 22, 12, 0, 0);
const at = (ms: number) => new Date(NOW + ms).toISOString();
const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

describe("countdown", () => {
  it.each([
    [30 * 1000, "due in 1 min"], // under a minute still reads as a minute, never "0 min"
    [45 * MIN, "due in 45 min"],
    [HOUR, "due in 1 h"],
    [2 * HOUR + 15 * MIN, "due in 2 h 15 min"],
    [DAY, "due in 1 day"],
    [3 * DAY + 5 * HOUR, "due in 3 days"],
  ])("%i ms ahead → %s", (ms, text) => expect(countdown(at(ms), NOW)).toEqual({ text, overdue: false }));

  it.each([
    [0, "due now"],
    [-30 * 1000, "due now"],
    [-5 * MIN, "overdue by 5 min"],
    [-(2 * HOUR), "overdue by 2 h"],
    [-DAY, "overdue by 1 day"],
  ])("%i ms ago → %s", (ms, text) => expect(countdown(at(ms), NOW)).toEqual({ text, overdue: true }));

  it("returns null for a date it cannot read", () => expect(countdown("nonsense", NOW)).toBeNull());
});

describe("datetime-local conversion", () => {
  it("round-trips a local time through ISO and back", () => {
    const iso = deadlineFromInput("2026-11-22T18:30");
    expect(iso).not.toBeNull();
    expect(inputFromDeadline(iso)).toBe("2026-11-22T18:30");
  });
  it("treats empty or invalid input as no deadline", () => {
    expect(deadlineFromInput("")).toBeNull();
    expect(deadlineFromInput("soon")).toBeNull();
    expect(inputFromDeadline(null)).toBe("");
    expect(inputFromDeadline("garbage")).toBe("");
  });
});
