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
    const s = run([{ type: "SET_PHONE", open: false }]); // the first action lets the always-there threads start; after that nothing is pending
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

  it("caps mission and todo length and the number of todos in the store itself", () => {
    let s = run([{ type: "SET_MISSION", text: "m".repeat(500) }, { type: "ADD_TODO", text: "t".repeat(500) }]);
    expect(s.mission).toHaveLength(80);
    expect(s.todos[0]!.text).toHaveLength(80);
    for (let i = 0; i < 250; i++) s = reducer(s, { type: "ADD_TODO", text: `todo ${i}` });
    expect(s.todos).toHaveLength(200);
  });

  it("never records negative focus when the clock was moved back before stopping", () => {
    const s = run([
      { type: "TIMER", event: { type: "START", now: T0 }, now: T0 },
      { type: "TIMER", event: { type: "STOP" }, now: T0 - 3 * 60 * 60_000 },
    ]);
    expect(derive(s).minutesFocused).toBe(0);
    expect(derive(s).knowledge).toBe(0);
  });

  it("sets a bus volume or a layer level, always inside 0–1 (junk becomes silent)", () => {
    const s = run([
      { type: "SET_VOLUME", bus: "music", value: 0.8 },
      { type: "SET_VOLUME", bus: "ambience", value: 5 },
      { type: "SET_VOLUME", bus: "ui", value: -3 },
      { type: "SET_LAYER_VOLUME", id: "leblanc-rain", value: 0.4 },
      { type: "SET_LAYER_VOLUME", id: "leblanc-murmur", value: Number.NaN },
    ]);
    expect(s.volumes).toEqual({ music: 0.8, ambience: 1, ui: 0 });
    expect(s.ambienceMix).toEqual({ "leblanc-rain": 0.4, "leblanc-murmur": 0 });
  });

  it("toggles widgets in Settings, but never the TV or the button bar", () => {
    let s = run([{ type: "TOGGLE_WIDGET", id: "timer" }, { type: "TOGGLE_WIDGET", id: "level" }]);
    expect(s.hiddenWidgets).toEqual(["timer", "level"]);
    s = reducer(s, { type: "TOGGLE_WIDGET", id: "timer" }); // toggled back on
    expect(s.hiddenWidgets).toEqual(["level"]);
    expect(reducer(s, { type: "TOGGLE_WIDGET", id: "music" })).toBe(s);
    expect(reducer(s, { type: "TOGGLE_WIDGET", id: "buttonBar" })).toBe(s);
  });

  it("only accepts the HUD size steps, and stores motion, analytics and the collapsed todo", () => {
    expect(run([{ type: "SET_HUD_SIZE", size: 1.3 }]).hudSize).toBe(1.3);
    expect(run([{ type: "SET_HUD_SIZE", size: 7 }]).hudSize).toBe(1);
    expect(run([{ type: "SET_MOTION", motion: "reduced" }]).motion).toBe("reduced");
    expect(run([{ type: "SET_ANALYTICS", on: false }]).analytics).toBe(false);
    expect(run([{ type: "SET_TODO_COLLAPSED", collapsed: true }]).todoCollapsed).toBe(true);
  });

  it("keeps a mission deadline only while there is a mission; invalid dates clear it", () => {
    expect(run([{ type: "SET_DEADLINE", iso: "2026-11-22T20:00:00.000Z" }]).missionDeadline).toBeNull(); // no mission yet
    let s = run([{ type: "SET_MISSION", text: "Read" }, { type: "SET_DEADLINE", iso: "2026-11-22T20:00:00.000Z" }]);
    expect(s.missionDeadline).toBe("2026-11-22T20:00:00.000Z");
    s = reducer(s, { type: "SET_MISSION", text: "Read more" }); // editing keeps the deadline
    expect(s.missionDeadline).toBe("2026-11-22T20:00:00.000Z");
    expect(reducer(s, { type: "SET_DEADLINE", iso: "garbage" }).missionDeadline).toBeNull();
    expect(reducer(s, { type: "SET_MISSION", text: "" }).missionDeadline).toBeNull(); // clearing the mission clears it
  });

  it("re-submitting the same mission (to change its deadline) keeps it done; a different mission is not done", () => {
    let s = run([{ type: "SET_MISSION", text: "Read" }, { type: "TOGGLE_MISSION_DONE" }]);
    expect(s.missionDone).toBe(true);
    s = reducer(s, { type: "SET_MISSION", text: "Read" });
    expect(s.missionDone).toBe(true);
    expect(reducer(s, { type: "SET_MISSION", text: "Something else" }).missionDone).toBe(false);
  });

  it("a reset never silently turns analytics back on", () => {
    const optedOut = run([{ type: "SET_ANALYTICS", on: false }]);
    expect(reducer(optedOut, { type: "RESET" }).analytics).toBe(false);
  });

  it("keeps demo mode on reset", () => {
    expect(reducer({ ...initialState, demo: true, entered: true }, { type: "RESET" })).toMatchObject({ demo: true, layer: "splash", entered: false });
  });

  it("dev tools: grant Knowledge, unlock everything, reset", () => {
    let s = run([{ type: "DEV_GRANT", knowledge: 5000 }, { type: "DEV_UNLOCK_ALL" }]);
    expect(derive(s).level).toBe(27); // 5000 Knowledge on the curve that now runs to level 29
    expect(derive(s).unlocked).toHaveLength(12);
    s = reducer(s, { type: "RESET" });
    expect(s).toEqual(initialState);
  });
});

describe("the calendar of studied days", () => {
  const at = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m).getTime();
  const session = (startMs: number, minutes: number, finish: "tick" | "stop", from?: AppState, tickAtMs?: number): AppState => run([
    { type: "START_SESSION", now: startMs }, // also works after a finished session, where the timer waits at "complete"
    finish === "tick"
      ? { type: "TIMER", event: { type: "TICK", now: tickAtMs ?? startMs + minutes * 60_000 }, now: tickAtMs ?? startMs + minutes * 60_000 }
      : { type: "TIMER", event: { type: "STOP" }, now: startMs + minutes * 60_000 },
  ], from);

  it("a finished session stamps the day it ended on", () => {
    const s = session(at(23, 12), 25, "tick");
    expect(s.studiedDays).toEqual([{ day: "2026-11-23", style: 0 }]);
  });

  it("a session that ended just before midnight is stamped on that day even if the tab only noticed after midnight", () => {
    const s = session(at(23, 23, 20), 25, "tick", undefined, at(24, 0, 30)); // ended 23:45 on the 23rd, noticed 00:30 on the 24th
    expect(s.studiedDays.map((d) => d.day)).toEqual(["2026-11-23"]);
  });

  it("a cut-short session of five minutes or more stamps the day; a shorter one does not", () => {
    expect(session(at(23, 12), 5, "stop").studiedDays.map((d) => d.day)).toEqual(["2026-11-23"]);
    expect(session(at(23, 12), 4, "stop").studiedDays).toEqual([]);
  });

  it("writing the first mission or a dev grant is not studying", () => {
    expect(run([{ type: "SET_MISSION", text: "Study" }, { type: "DEV_GRANT", knowledge: 500 }]).studiedDays).toEqual([]);
  });

  it("two sessions on one day stamp it once; the next day adds another", () => {
    let s = session(at(23, 9), 25, "tick");
    s = session(at(23, 14), 25, "tick", s);
    s = session(at(24, 9), 25, "tick", s);
    expect(s.studiedDays.map((d) => d.day)).toEqual(["2026-11-23", "2026-11-24"]);
  });

  it("the stamp design is the newest one earned by then: the default at first, the star once level 4 is reached", () => {
    const early = session(at(23, 12), 25, "tick");
    expect(early.studiedDays[0]!.style).toBe(0);
    const later = session(at(24, 12), 25, "tick", run([{ type: "DEV_GRANT", knowledge: 125 }]));
    expect(later.studiedDays[0]!.style).toBe(1); // level 4 gives the second design
  });

  it("starting over (reset) clears the calendar with everything else", () => {
    expect(reducer(session(at(23, 12), 25, "tick"), { type: "RESET" }).studiedDays).toEqual([]);
  });
});

describe("travel and the arriving sign", () => {
  it("the reveal makes the destination the current place while travel is still going", () => {
    const s = run([{ type: "START_TRAVEL", to: "ryuji" }, { type: "TRAVEL_REVEAL" }]);
    expect(s.locationId).toBe("ryuji");
    expect(s.visited).toContain("ryuji");
    expect(s.layer).toBe("travel"); // not over yet: the wipe is still uncovering the room
    expect(s.travelTo).toBe("ryuji");
  });

  it("arriving ends travel, and still works when no reveal came first", () => {
    const revealed = run([{ type: "START_TRAVEL", to: "ryuji" }, { type: "TRAVEL_REVEAL" }, { type: "ARRIVE" }]);
    expect(revealed).toMatchObject({ layer: "main", locationId: "ryuji", travelTo: null });
    const direct = run([{ type: "START_TRAVEL", to: "ryuji" }, { type: "ARRIVE" }]);
    expect(direct).toMatchObject({ layer: "main", locationId: "ryuji", travelTo: null });
    expect(direct.visited.filter((v) => v === "ryuji")).toHaveLength(1); // remembered once
  });

  it("a reveal with nowhere to go changes nothing", () => {
    const s = run([{ type: "SET_PHONE", open: false }]);
    expect(reducer(s, { type: "TRAVEL_REVEAL" })).toBe(s);
  });

  it("the sign arrives big on the first visit to a place, once, however travel ends", () => {
    expect(run([{ type: "START_TRAVEL", to: "ryuji" }, { type: "TRAVEL_REVEAL" }]).signArriving).toBe(true);
    expect(run([{ type: "START_TRAVEL", to: "ryuji" }, { type: "ARRIVE" }]).signArriving).toBe(true);
    // Reveal then arrive: it arrived at the reveal and is not re-armed by the end.
    const settledMidway = run([{ type: "START_TRAVEL", to: "ryuji" }, { type: "TRAVEL_REVEAL" }, { type: "SIGN_SETTLED" }, { type: "ARRIVE" }]);
    expect(settledMidway.signArriving).toBe(false);
  });

  it("going back to a place already visited does not bring the sign in big again", () => {
    const back = run([{ type: "START_TRAVEL", to: "ryuji" }, { type: "ARRIVE" }, { type: "SIGN_SETTLED" }, { type: "START_TRAVEL", to: "leblanc" }, { type: "ARRIVE" }]);
    expect(back.signArriving).toBe(false);
  });

  it("entering the room for the first time brings the sign in big; a return does not", () => {
    expect(reducer({ ...initialState, firstVisit: true }, { type: "ENTER" }).signArriving).toBe(true);
    expect(reducer({ ...initialState, firstVisit: false }, { type: "ENTER" }).signArriving).toBe(false);
  });

  it("settling clears it, and settling when it is not big changes nothing", () => {
    const big = run([{ type: "START_TRAVEL", to: "ryuji" }, { type: "ARRIVE" }]);
    expect(reducer(big, { type: "SIGN_SETTLED" }).signArriving).toBe(false);
    const quiet = reducer(big, { type: "SIGN_SETTLED" });
    expect(reducer(quiet, { type: "SIGN_SETTLED" })).toBe(quiet);
  });
});
