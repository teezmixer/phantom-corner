import { describe, expect, it } from "vitest";
import { derive, initialState, reducer, type Action, type AppState } from "./store";

const run = (actions: Action[], from: AppState = { ...initialState, layer: "main", entered: true }) => actions.reduce(reducer, from);
const T0 = 1_000_000;

describe("store reducer", () => {
  it("enters from the splash to the main screen", () => {
    expect(reducer(initialState, { type: "ENTER" })).toMatchObject({ layer: "main", entered: true });
  });

  it("closes a screen back to where the user was", () => {
    const aboutFromSplash = reducer(initialState, { type: "SET_LAYER", layer: "about" });
    expect(reducer(aboutFromSplash, { type: "CLOSE_LAYER" }).layer).toBe("splash");
    const entered = reducer(initialState, { type: "ENTER" });
    const menu = reducer(entered, { type: "SET_LAYER", layer: "menu" });
    expect(reducer(menu, { type: "CLOSE_LAYER" }).layer).toBe("main");
  });

  it("grants first-mission Knowledge once and ignores empty missions", () => {
    const s = run([{ type: "SET_MISSION", text: "  " }, { type: "SET_MISSION", text: "Finish chapter 3" }, { type: "SET_MISSION", text: "Finish chapter 4" }]);
    expect(s.mission).toBe("Finish chapter 4");
    expect(derive(s).knowledge).toBe(10);
    expect(derive(s).level).toBe(2);
    expect(derive(s).mapOpen).toBe(true);
  });

  it("adds, ticks and deletes todos, ignoring blanks", () => {
    let s = run([{ type: "ADD_TODO", text: "read" }, { type: "ADD_TODO", text: " " }, { type: "ADD_TODO", text: "write" }]);
    expect(s.todos.map((t) => t.text)).toEqual(["read", "write"]);
    s = run([{ type: "TOGGLE_TODO", id: 1 }], s);
    expect(s.todos[0]?.done).toBe(true);
    s = run([{ type: "DELETE_TODO", id: 1 }], s);
    expect(s.todos.map((t) => t.text)).toEqual(["write"]);
  });

  it("runs the loop: mission → timer → complete → choice, unlocking Ryuji", () => {
    const s = run([
      { type: "SET_MISSION", text: "Study" },
      { type: "TIMER", event: { type: "START", now: T0 }, now: T0 },
      { type: "TIMER", event: { type: "TICK", now: T0 + 25 * 60_000 }, now: T0 + 25 * 60_000 },
    ]);
    expect(s.layer).toBe("choice");
    expect(s.timer.status).toBe("complete");
    const d = derive(s);
    expect(d.knowledge).toBe(40);
    expect(d.unlocked).toContain("ryuji");
    expect(d.sessions).toBe(1);
    expect(d.minutesFocused).toBe(25);
  });

  it("records a cut-short session when stopped, and goes to the summary", () => {
    const s = run([
      { type: "TIMER", event: { type: "START", now: T0 }, now: T0 },
      { type: "TIMER", event: { type: "STOP" }, now: T0 + 12 * 60_000 },
    ]);
    expect(s.layer).toBe("summary");
    expect(derive(s).knowledge).toBe(12);
    expect(s.timer.status).toBe("idle");
  });

  it("records a cut-short session when stopped from paused too, so paused minutes are not lost", () => {
    const s = run([
      { type: "TIMER", event: { type: "START", now: T0 }, now: T0 },
      { type: "TIMER", event: { type: "PAUSE", now: T0 + 9 * 60_000 }, now: T0 + 9 * 60_000 },
      { type: "TIMER", event: { type: "STOP" }, now: T0 + 60 * 60_000 }, // a long time later; pause time does not count
    ]);
    expect(s.layer).toBe("summary");
    expect(derive(s).minutesFocused).toBe(9);
    expect(derive(s).knowledge).toBe(9);
  });

  it("does not change state for a meaningless timer event", () => {
    const s = run([]);
    expect(reducer(s, { type: "TIMER", event: { type: "PAUSE", now: T0 }, now: T0 })).toBe(s);
  });

  it("travels: covering → arrive at the destination, remembering visits", () => {
    let s = run([{ type: "START_TRAVEL", to: "ryuji" }]);
    expect(s.layer).toBe("travel");
    s = run([{ type: "ARRIVE" }], s);
    expect(s.layer).toBe("main");
    expect(s.locationId).toBe("ryuji");
    expect(s.visited).toEqual(["leblanc", "ryuji"]);
  });

  it("starts the next session or finishes from the end-of-session choice", () => {
    const done = run([
      { type: "TIMER", event: { type: "START", now: T0 }, now: T0 },
      { type: "TIMER", event: { type: "TICK", now: T0 + 25 * 60_000 }, now: T0 + 25 * 60_000 },
    ]);
    const again = reducer(done, { type: "START_SESSION", now: T0 + 26 * 60_000 });
    expect(again.layer).toBe("main");
    expect(again.timer).toMatchObject({ status: "running", endsAt: T0 + 51 * 60_000 });
    const finished = reducer(done, { type: "FINISH" });
    expect(finished).toMatchObject({ layer: "main", timer: { status: "idle" } });
  });

  it("takes five: break layer with a 5-minute end, then back to the choice", () => {
    const onBreak = reducer(run([]), { type: "START_BREAK", now: T0 });
    expect(onBreak).toMatchObject({ layer: "break", breakEndsAt: T0 + 5 * 60_000 });
    expect(reducer(onBreak, { type: "END_BREAK" })).toMatchObject({ layer: "choice", breakEndsAt: null });
  });

  it("never leaves a finished timer stuck: travelling or closing the map keeps it usable", () => {
    const done = run([
      { type: "TIMER", event: { type: "START", now: T0 }, now: T0 },
      { type: "TIMER", event: { type: "TICK", now: T0 + 25 * 60_000 }, now: T0 + 25 * 60_000 },
    ]);
    // "Go somewhere else" → travel: the finished timer is acknowledged
    const travelling = reducer(done, { type: "START_TRAVEL", to: "ryuji" });
    expect(travelling.timer.status).toBe("idle");
    // …and a timer left at "complete" (map closed instead) can still start a new session
    const again = reducer(reducer(done, { type: "SET_LAYER", layer: "main" }), { type: "START_SESSION", now: T0 + 30 * 60_000 });
    expect(again.timer.status).toBe("running");
  });

  it("keeps a running timer running while travelling", () => {
    const running = run([{ type: "TIMER", event: { type: "START", now: T0 }, now: T0 }]);
    expect(reducer(running, { type: "START_TRAVEL", to: "ryuji" }).timer).toBe(running.timer);
  });

  it("closes the info pages back to Settings once in the room, and to the splash before", () => {
    const entered = run([]);
    expect(reducer({ ...entered, layer: "credits" }, { type: "CLOSE_LAYER" }).layer).toBe("settings");
    expect(reducer({ ...initialState, layer: "about" }, { type: "CLOSE_LAYER" }).layer).toBe("splash");
  });

  it("keeps demo mode on reset", () => {
    expect(reducer({ ...initialState, demo: true, entered: true }, { type: "RESET" })).toMatchObject({ demo: true, layer: "splash", entered: false });
  });

  it("dev tools: grant Knowledge, unlock everything, reset", () => {
    let s = run([{ type: "DEV_GRANT", knowledge: 5000 }, { type: "DEV_UNLOCK_ALL" }]);
    expect(derive(s).level).toBe(25);
    expect(derive(s).unlocked).toHaveLength(12);
    s = reducer(s, { type: "RESET" });
    expect(s).toEqual(initialState);
  });
});
