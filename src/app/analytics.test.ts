import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialState, reducer, type Action, type AppState } from "@/state/store";
import { EVENT_NAMES, eventsFor, sanitize, setSender, track, type EventName, type EventProps } from "./analytics";
import { setAnalyticsAllowed } from "./telemetry";

const sent: { name: EventName; props: EventProps }[] = [];
beforeEach(() => { sent.length = 0; setAnalyticsAllowed(true); setSender((name, props) => { sent.push({ name, props }); }); });
afterEach(() => setAnalyticsAllowed(true));

const room: AppState = { ...initialState, layer: "main", entered: true, firstVisit: false };
const run = (actions: Action[], from: AppState = room) => actions.reduce(reducer, from);
const names = (prev: AppState, next: AppState) => eventsFor(prev, next).map((e) => e.name);

describe("the event list (spec §4.16)", () => {
  it("is exactly the twelve the spec names", () => {
    expect([...EVENT_NAMES]).toEqual(["entered", "session_started", "session_completed", "session_stopped", "mission_set", "music_played", "track_unavailable", "location_unlocked", "travelled", "save_prompt_shown", "save_prompt_accepted", "feedback_opened"]);
  });
});

describe("sanitize: the only properties are where, how long and how far", () => {
  it("keeps location, plannedMin, focusedMin and level", () => {
    expect(sanitize({ location: "ryuji", plannedMin: 25, focusedMin: 25, level: 3 })).toEqual({ location: "ryuji", plannedMin: 25, focusedMin: 25, level: 3 });
  });

  it("drops everything else, whatever it is called, including text a player wrote", () => {
    const out = sanitize({ mission: "Finish my thesis", todo: "buy milk", text: "x", name: "Ren", location: "leblanc", note: "secret", level: 2 });
    expect(out).toEqual({ location: "leblanc", level: 2 });
    expect(JSON.stringify(out)).not.toMatch(/thesis|milk|Ren|secret/);
  });

  it("a location must look like an id: free text sent as a location is dropped", () => {
    expect(sanitize({ location: "Finish my thesis" })).toEqual({});
    expect(sanitize({ location: "a".repeat(80) })).toEqual({});
    expect(sanitize({ location: "<script>" })).toEqual({});
    expect(sanitize({ location: "velvet-room" })).toEqual({ location: "velvet-room" });
  });

  it("numbers must be small whole-ish numbers; junk is dropped and fractions are rounded", () => {
    expect(sanitize({ plannedMin: "25", focusedMin: NaN, level: Infinity })).toEqual({});
    expect(sanitize({ plannedMin: -3, focusedMin: 1e9 })).toEqual({});
    expect(sanitize({ plannedMin: 24.6 })).toEqual({ plannedMin: 25 });
  });

  it("copes with nothing", () => {
    expect(sanitize(undefined)).toEqual({});
  });
});

describe("track", () => {
  it("sends the event with sanitised properties while the switch is on", () => {
    track("session_started", { location: "leblanc", plannedMin: 25, mission: "never" });
    expect(sent).toEqual([{ name: "session_started", props: { location: "leblanc", plannedMin: 25 } }]);
  });

  it("sends nothing at all once the switch is off (honoured at send time, before anything leaves)", () => {
    setAnalyticsAllowed(false);
    track("entered", { location: "leblanc", level: 1 });
    expect(sent).toEqual([]);
    setAnalyticsAllowed(true);
    track("entered", { location: "leblanc", level: 1 });
    expect(sent).toHaveLength(1);
  });

  it("ignores a name that is not on the list", () => {
    track("not_an_event" as EventName, { location: "leblanc" });
    expect(sent).toEqual([]);
  });

  it("the real sender goes through @vercel/analytics (window.va) with the name and data", async () => {
    vi.resetModules();
    const calls: unknown[][] = [];
    (window as unknown as { va: (...a: unknown[]) => void }).va = (...a) => { calls.push(a); };
    const fresh = await import("./analytics");
    const telemetry = await import("./telemetry");
    telemetry.setAnalyticsAllowed(true);
    fresh.track("travelled", { location: "ryuji", mission: "secret" });
    delete (window as unknown as { va?: unknown }).va;
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(calls[0])).not.toContain("secret");
    expect(calls[0]![0]).toBe("event");
    expect(calls[0]![1]).toMatchObject({ name: "travelled" });
  });
});

describe("eventsFor: which changes are events", () => {
  it("nothing at load, and nothing for the demo", () => {
    expect(eventsFor(room, room)).toEqual([]);
    const demo = { ...room, demo: true };
    expect(eventsFor(demo, run([{ type: "START_SESSION", now: 0 }], demo))).toEqual([]);
  });

  it("entered, with where and how far", () => {
    const splash: AppState = { ...initialState, layer: "splash", entered: false };
    expect(eventsFor(splash, { ...splash, entered: true, layer: "main" })).toEqual([{ name: "entered", props: { location: "leblanc", level: 1 } }]);
  });

  it("session_started with the planned minutes, once; pausing and resuming is not a new start", () => {
    const running = run([{ type: "START_SESSION", now: 0 }]);
    expect(eventsFor(room, running)).toEqual([{ name: "session_started", props: { location: "leblanc", plannedMin: 25 } }]);
    const paused = run([{ type: "TIMER", event: { type: "PAUSE", now: 60_000 }, now: 60_000 }], running);
    expect(names(running, paused)).toEqual([]);
    expect(names(paused, run([{ type: "TIMER", event: { type: "RESUME", now: 120_000 }, now: 120_000 }], paused))).toEqual([]);
  });

  it("session_completed with planned and focused minutes and the level reached; session_stopped for a cut-short one", () => {
    const running = run([{ type: "START_SESSION", now: 0 }]);
    const done = run([{ type: "TIMER", event: { type: "TICK", now: 25 * 60_000 }, now: 25 * 60_000 }], running);
    expect(eventsFor(running, done).find((e) => e.name === "session_completed")).toEqual({ name: "session_completed", props: { location: "leblanc", plannedMin: 25, focusedMin: 25, level: 2 } }); // 30 Knowledge: level 2
    const stopped = run([{ type: "TIMER", event: { type: "STOP" }, now: 10 * 60_000 }], running);
    expect(eventsFor(running, stopped).find((e) => e.name === "session_stopped")?.props).toMatchObject({ plannedMin: 25, focusedMin: 10 });
  });

  it("mission_set when a mission is written or changed, not when it is cleared or unchanged", () => {
    const wrote = run([{ type: "SET_MISSION", text: "Read" }]);
    expect(eventsFor(room, wrote).map((e) => e.name)).toContain("mission_set");
    expect(names(wrote, run([{ type: "SET_MISSION", text: "Read" }], wrote))).not.toContain("mission_set");
    expect(names(wrote, run([{ type: "SET_MISSION", text: "" }], wrote))).not.toContain("mission_set");
  });

  it("location_unlocked for a newly open place with its level; not for the dev panel's unlock-all", () => {
    const before = run([{ type: "DEV_GRANT", knowledge: 34 }]);
    const after = run([{ type: "DEV_GRANT", knowledge: 1 }], before);
    expect(eventsFor(before, after).find((e) => e.name === "location_unlocked")).toEqual({ name: "location_unlocked", props: { location: "ryuji", level: 3 } });
    expect(names(room, run([{ type: "DEV_UNLOCK_ALL" }]))).not.toContain("location_unlocked");
  });

  it("travelled when the place changes, and feedback_opened when the feedback thread is opened", () => {
    const there = run([{ type: "DEV_UNLOCK_ALL" }, { type: "START_TRAVEL", to: "ryuji" }, { type: "TRAVEL_REVEAL" }]);
    expect(eventsFor(room, there).find((e) => e.name === "travelled")).toEqual({ name: "travelled", props: { location: "ryuji" } });
    const open = run([{ type: "SET_PHONE", open: true }]);
    expect(names(open, run([{ type: "OPEN_THREAD", id: "feedback" }], open))).toEqual(["feedback_opened"]);
    expect(names(open, run([{ type: "OPEN_THREAD", id: "morgana" }], open))).toEqual([]);
  });

  it("never carries the text of a mission, a todo, a name or a feedback message, through a whole session of play", () => {
    const secrets = ["Finish my secret thesis", "buy secret milk", "Secretina", "my secret feedback"];
    let s = run([{ type: "SET_PHONE", open: false }]);
    const all: unknown[] = [];
    const step = (a: Action) => { const next = reducer(s, a); all.push(...eventsFor(s, next)); s = next; };
    step({ type: "SET_MISSION", text: secrets[0]! });
    step({ type: "ADD_TODO", text: secrets[1]! });
    step({ type: "DEV_GRANT", knowledge: 200 });
    step({ type: "OPEN_THREAD", id: "feedback" });
    step({ type: "POST_MESSAGE", id: "feedback", text: secrets[3]! });
    step({ type: "START_SESSION", now: 0 });
    step({ type: "TIMER", event: { type: "TICK", now: 25 * 60_000 }, now: 25 * 60_000 });
    expect(all.length).toBeGreaterThan(3);
    for (const secret of secrets) expect(JSON.stringify(all)).not.toContain(secret);
  });
});

describe("a sync is not something the player just did (final review)", () => {
  it("sends nothing for other devices' sessions arriving in the log, or for places their history opens", () => {
    const here = { ...initialState, entered: true, layer: "main" as const, firstVisit: false, clientId: "c1", events: [] };
    const remote = [
      { kind: "session" as const, plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed" as const, id: "other:1" },
      { kind: "session" as const, plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed" as const, id: "other:2" },
    ];
    expect(eventsFor(here, { ...here, events: remote })).toEqual([]);
    // …while a session recorded here still counts.
    const mine = { kind: "session" as const, plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed" as const, id: "c1:1" };
    expect(eventsFor(here, { ...here, events: [mine] }).map((e) => e.name)).toContain("session_completed");
  });
});
