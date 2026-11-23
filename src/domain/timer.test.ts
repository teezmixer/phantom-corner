import { describe, expect, it } from "vitest";
import { DEFAULT_DURATION_MS, MINUTE, clampCustomMinutes, formatClock, initialTimer, remainingMs, timerAnnouncement, transition, type TimerState } from "./timer";

const T0 = 1_000_000;

describe("timer transitions", () => {
  it("starts from idle and ends at now + duration", () => {
    const s = transition(initialTimer, { type: "START", now: T0 });
    expect(s).toEqual({ status: "running", durationMs: DEFAULT_DURATION_MS, endsAt: T0 + DEFAULT_DURATION_MS });
  });

  it("pauses with the correct time left and resumes from it", () => {
    const running = transition(initialTimer, { type: "START", now: T0 });
    const paused = transition(running, { type: "PAUSE", now: T0 + 10 * MINUTE });
    expect(paused).toMatchObject({ status: "paused", remainingMs: 15 * MINUTE });
    // 40 minutes pass while paused; nothing is lost or gained
    const resumed = transition(paused, { type: "RESUME", now: T0 + 50 * MINUTE });
    expect(remainingMs(resumed, T0 + 50 * MINUTE)).toBe(15 * MINUTE);
    expect(remainingMs(resumed, T0 + 55 * MINUTE)).toBe(10 * MINUTE);
  });

  it("completes on the first tick at or after endsAt, not before", () => {
    const running = transition(initialTimer, { type: "START", now: T0 });
    const endsAt = T0 + DEFAULT_DURATION_MS;
    expect(transition(running, { type: "TICK", now: endsAt - 1 })).toBe(running);
    expect(transition(running, { type: "TICK", now: endsAt }).status).toBe("complete");
  });

  it("stops from running or paused back to idle, keeping the duration", () => {
    const set = transition(initialTimer, { type: "SET_DURATION", durationMs: 10 * MINUTE });
    const running = transition(set, { type: "START", now: T0 });
    expect(transition(running, { type: "STOP" })).toEqual({ status: "idle", durationMs: 10 * MINUTE });
    const paused = transition(running, { type: "PAUSE", now: T0 + 1 });
    expect(transition(paused, { type: "STOP" })).toEqual({ status: "idle", durationMs: 10 * MINUTE });
  });

  it("acknowledges a completed session back to idle", () => {
    const done: TimerState = { status: "complete", durationMs: MINUTE };
    expect(transition(done, { type: "ACKNOWLEDGE" })).toEqual({ status: "idle", durationMs: MINUTE });
  });

  it("returns the same object for combinations that mean nothing", () => {
    const running = transition(initialTimer, { type: "START", now: T0 });
    expect(transition(initialTimer, { type: "PAUSE", now: T0 })).toBe(initialTimer);
    expect(transition(initialTimer, { type: "TICK", now: T0 })).toBe(initialTimer);
    expect(transition(running, { type: "START", now: T0 + 5 })).toBe(running);
    expect(transition(running, { type: "SET_DURATION", durationMs: 1 })).toBe(running);
  });

  it("only allows changing the duration while idle", () => {
    expect(transition(initialTimer, { type: "SET_DURATION", durationMs: 30 * MINUTE })).toMatchObject({ durationMs: 30 * MINUTE });
  });
});

describe("remainingMs and formatClock", () => {
  it("derives remaining time from endsAt and never goes negative", () => {
    const running = transition(initialTimer, { type: "START", now: T0 });
    expect(remainingMs(running, T0 + 5 * MINUTE)).toBe(20 * MINUTE);
    expect(remainingMs(running, T0 + 99 * MINUTE)).toBe(0);
  });

  it.each([
    [25 * MINUTE, "25:00"],
    [90_000, "01:30"],
    [1, "00:01"], // partial second rounds up
    [0, "00:00"],
    [-500, "00:00"],
  ])("formats %i ms as %s", (ms, text) => expect(formatClock(ms)).toBe(text));
});

describe("clock changes and limits", () => {
  const running = transition(initialTimer, { type: "START", now: T0 });

  it("never shows more time than the session has, even if the system clock moves back", () => {
    expect(remainingMs(running, T0 - 60 * MINUTE)).toBe(DEFAULT_DURATION_MS);
    const paused = transition(running, { type: "PAUSE", now: T0 - 60 * MINUTE });
    expect(paused).toMatchObject({ status: "paused", remainingMs: DEFAULT_DURATION_MS });
  });

  it("forces SET_DURATION into the allowed range", () => {
    expect(transition(initialTimer, { type: "SET_DURATION", durationMs: -5 })).toMatchObject({ durationMs: 5 * MINUTE });
    expect(transition(initialTimer, { type: "SET_DURATION", durationMs: 0 })).toMatchObject({ durationMs: 5 * MINUTE });
    expect(transition(initialTimer, { type: "SET_DURATION", durationMs: 99 * 60 * MINUTE })).toMatchObject({ durationMs: 120 * MINUTE });
    expect(transition(initialTimer, { type: "SET_DURATION", durationMs: Number.NaN })).toMatchObject({ durationMs: 25 * MINUTE });
  });
});

describe("clampCustomMinutes", () => {
  it.each([
    [25, 25], [5, 5], [120, 120], [4, 5], [0, 5], [-10, 5], [121, 120], [9999, 120], [17.6, 18], [Number.NaN, 25], [Infinity, 25],
  ])("%s → %s", (input, out) => expect(clampCustomMinutes(input)).toBe(out));
});

describe("timerAnnouncement", () => {
  const running = (endsAt: number): TimerState => ({ status: "running", durationMs: 25 * MINUTE, endsAt });
  const at = (leftMs: number) => timerAnnouncement(running(10_000_000 + leftMs), 10_000_000);

  it("says nothing when idle or complete, and 'Paused' when paused", () => {
    expect(timerAnnouncement({ status: "idle", durationMs: 25 * MINUTE }, 0)).toBe("");
    expect(timerAnnouncement({ status: "complete", durationMs: 25 * MINUTE }, 0)).toBe("");
    expect(timerAnnouncement({ status: "paused", durationMs: 25 * MINUTE, remainingMs: 5 * MINUTE }, 0)).toBe("Paused");
  });

  it("keeps the same sentence for every second inside a five-minute step, so it is not read each second", () => {
    expect(at(25 * MINUTE)).toBe("25 minutes left");
    expect(at(24 * MINUTE + 1000)).toBe("25 minutes left");
    expect(at(20 * MINUTE)).toBe("20 minutes left");
    expect(at(20 * MINUTE - 1000)).toBe("20 minutes left");
    expect(at(19 * MINUTE + 1000)).toBe("20 minutes left");
    expect(at(15 * MINUTE)).toBe("15 minutes left");
    expect(at(5 * MINUTE)).toBe("5 minutes left");
    expect(at(MINUTE)).toBe("5 minutes left");
  });

  it("switches to one sentence for the last minute, and to nothing at zero", () => {
    expect(at(MINUTE - 1)).toBe("Less than a minute left");
    expect(at(1000)).toBe("Less than a minute left");
    expect(at(0)).toBe("");
  });
});
