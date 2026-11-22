import { describe, expect, it } from "vitest";
import { MINUTE } from "@/domain/timer";
import { initialState, reducer, type Action, type AppState } from "./store";
import { bannersFor } from "./banners";

const room: AppState = { ...initialState, entered: true, layer: "main" };
const run = (actions: Action[], from: AppState = room) => actions.reduce(reducer, from);
const texts = (prev: AppState, next: AppState) => bannersFor(prev, next).map((b) => b.text);

describe("bannersFor", () => {
  it("says nothing when nothing changed (no banner at load)", () => {
    expect(bannersFor(room, room)).toEqual([]);
    expect(texts(room, { ...room, mission: "x" })).toEqual([]);
  });

  it("greets a returning user with Sojiro's line, verbatim — and a first visit with nothing", () => {
    const splash: AppState = { ...initialState, entered: false, layer: "splash" };
    expect(texts(splash, { ...splash, entered: true, layer: "main" })).toEqual(["Ah, you're back."]);
    const firstVisit = { ...splash, firstVisit: true };
    expect(texts(firstVisit, { ...firstVisit, entered: true, layer: "main" })).toEqual([]);
    const demo = { ...splash, demo: true };
    expect(texts(demo, { ...demo, entered: true, layer: "main" })).toEqual([]);
  });

  it("announces Knowledge gained, a level-up and a newly unlocked place, in that order", () => {
    const withMission = run([{ type: "SET_MISSION", text: "Study" }]); // +10 Knowledge → level 2
    expect(texts(room, withMission)).toEqual(["+10 Knowledge", "Level 2"]);
    const done = run([
      { type: "TIMER", event: { type: "START", now: 0 }, now: 0 },
      { type: "TIMER", event: { type: "TICK", now: 25 * MINUTE }, now: 25 * MINUTE },
    ], withMission);
    // 10 → 40: +30 Knowledge, level 2 → 3, and Ryuji unlocks at level 3
    expect(texts(withMission, done)).toEqual(["+30 Knowledge", "Level 3", "You unlocked a new location. Someone's waiting for you."]);
  });

  it("uses Ares's unlock line verbatim and never fires for the dev panel's unlock-all", () => {
    expect(texts(room, run([{ type: "DEV_UNLOCK_ALL" }]))).toEqual([]);
    expect(texts(room, run([{ type: "DEV_GRANT", knowledge: 40 }]))).toContain("You unlocked a new location. Someone's waiting for you.");
  });

  it("gives each banner a distinct id so repeats are shown, not merged", () => {
    const a = bannersFor(room, run([{ type: "DEV_GRANT", knowledge: 5 }]));
    const b = bannersFor(run([{ type: "DEV_GRANT", knowledge: 5 }]), run([{ type: "DEV_GRANT", knowledge: 5 }, { type: "DEV_GRANT", knowledge: 5 }]));
    expect(a[0]!.id).not.toBe(b[0]!.id);
  });
});

describe("banner queue in the store", () => {
  it("appends the banners a change deserves, shows them oldest first, and dismisses one at a time", () => {
    let s = run([{ type: "SET_MISSION", text: "Study" }]);
    expect(s.banners.map((b) => b.text)).toEqual(["+10 Knowledge", "Level 2"]);
    s = reducer(s, { type: "DISMISS_BANNER" });
    expect(s.banners.map((b) => b.text)).toEqual(["Level 2"]);
    s = reducer(s, { type: "DISMISS_BANNER" });
    expect(s.banners).toEqual([]);
    expect(reducer(s, { type: "DISMISS_BANNER" })).toBe(s); // nothing to dismiss
  });

  it("caps the queue so a flood cannot pile up", () => {
    let s = room;
    for (let i = 0; i < 20; i++) s = reducer(s, { type: "DEV_GRANT", knowledge: 1 });
    expect(s.banners.length).toBeLessThanOrEqual(4);
  });

  it("starts a return visit with the greeting waiting, and clears everything on reset", () => {
    const splash: AppState = { ...initialState, entered: false, layer: "splash" };
    const entered = reducer(splash, { type: "ENTER" });
    expect(entered.banners.map((b) => b.text)).toEqual(["Ah, you're back."]);
    expect(reducer(entered, { type: "RESET" }).banners).toEqual([]);
  });
});
