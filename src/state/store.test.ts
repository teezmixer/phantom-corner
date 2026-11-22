import { describe, expect, it } from "vitest";
import { derive, initialState, reducer, type Action, type AppState } from "./store";

const run = (actions: Action[], from: AppState = { ...initialState, layer: "main" }) => actions.reduce(reducer, from);
const T0 = 1_000_000;

describe("store reducer", () => {
  it("enters from the splash to the main screen", () => {
    expect(reducer(initialState, { type: "ENTER" }).layer).toBe("main");
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

  it("dev tools: grant Knowledge, unlock everything, reset", () => {
    let s = run([{ type: "DEV_GRANT", knowledge: 5000 }, { type: "DEV_UNLOCK_ALL" }]);
    expect(derive(s).level).toBe(25);
    expect(derive(s).unlocked).toHaveLength(12);
    s = reducer(s, { type: "RESET" });
    expect(s).toEqual(initialState);
  });
});
