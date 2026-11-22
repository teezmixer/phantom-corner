import { describe, expect, it } from "vitest";
import { MINUTE } from "@/domain/timer";
import { initialState, type AppState } from "@/state/store";
import { sfxFor } from "./triggers";

const base: AppState = { ...initialState, entered: true, layer: "main" };
const completed = { kind: "session", plannedMs: 25 * MINUTE, focusedMs: 25 * MINUTE, outcome: "completed" } as const;
const stopped = { kind: "session", plannedMs: 25 * MINUTE, focusedMs: 9 * MINUTE, outcome: "stopped" } as const;

describe("sfxFor", () => {
  it("plays nothing when nothing changed (no sound at load, nothing unprompted)", () => {
    expect(sfxFor(base, base)).toEqual([]);
    expect(sfxFor(base, { ...base, mission: "x" })).toEqual([]);
  });

  it("rings the doorbell on a first-ever arrival, not on a return visit", () => {
    const splash: AppState = { ...initialState, entered: false, layer: "splash" };
    expect(sfxFor({ ...splash, firstVisit: true }, { ...splash, firstVisit: true, entered: true, layer: "main" })).toEqual(["doorbell"]);
    expect(sfxFor(splash, { ...splash, entered: true, layer: "main" })).toEqual([]);
  });

  it("opens and closes the menu, and travels", () => {
    expect(sfxFor(base, { ...base, layer: "menu" })).toEqual(["menuOpen"]);
    expect(sfxFor({ ...base, layer: "menu" }, { ...base, layer: "main" })).toEqual(["menuClose"]);
    expect(sfxFor({ ...base, layer: "menu" }, { ...base, layer: "map" })).toEqual(["menuClose"]);
    expect(sfxFor({ ...base, layer: "map" }, { ...base, layer: "travel" })).toEqual(["travel"]);
  });

  it("starts a session with a sound, but not when resuming from a pause", () => {
    const running = { status: "running", durationMs: 25 * MINUTE, endsAt: 1 } as const;
    expect(sfxFor(base, { ...base, timer: running })).toEqual(["sessionStart"]);
    expect(sfxFor({ ...base, timer: { status: "complete", durationMs: 1 } }, { ...base, timer: running })).toEqual(["sessionStart"]);
    expect(sfxFor({ ...base, timer: { status: "paused", durationMs: 25 * MINUTE, remainingMs: 5 } }, { ...base, timer: running })).toEqual([]);
  });

  it("plays the completion fanfare only for a newly completed session, never for a stopped one or old events", () => {
    expect(sfxFor(base, { ...base, events: [completed] })).toContain("sessionComplete");
    expect(sfxFor(base, { ...base, events: [stopped] })).not.toContain("sessionComplete");
    const withOld = { ...base, events: [completed] };
    expect(sfxFor(withOld, { ...withOld, mission: "later" })).toEqual([]);
  });
});
