import { describe, expect, it } from "vitest";
import { MINUTE } from "@/domain/timer";
import { MAX_BANNERS, initialState, reducer, type Action, type AppState } from "./store";
import { bannersFor } from "./banners";
import { derive } from "./derive";

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

  it("does not say 'you're back' when the save was lost or cannot be kept (it would contradict the notice)", () => {
    const splash: AppState = { ...initialState, entered: false, layer: "splash" };
    for (const flag of [{ recovered: true }, { storageBlocked: true }] as const) {
      const before = { ...splash, ...flag };
      expect(texts(before, { ...before, entered: true, layer: "main" })).toEqual([]);
    }
  });

  it("announces Knowledge gained, a level-up, that level's gift and a newly unlocked place, in that order", () => {
    const withMission = run([{ type: "SET_MISSION", text: "Study" }]); // +10 Knowledge → level 2, whose gift is the map
    expect(texts(room, withMission)).toEqual(["+10 Knowledge", "Level 2", "Morgana: There's a map now. Don't wander off."]);
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
    expect(s.banners.map((b) => b.text)).toEqual(["+10 Knowledge", "Level 2", "Morgana: There's a map now. Don't wander off."]);
    s = reducer(s, { type: "DISMISS_BANNER" });
    expect(s.banners.map((b) => b.text)).toEqual(["Level 2", "Morgana: There's a map now. Don't wander off."]);
    s = reducer(s, { type: "DISMISS_BANNER" });
    s = reducer(s, { type: "DISMISS_BANNER" });
    expect(s.banners).toEqual([]);
    expect(reducer(s, { type: "DISMISS_BANNER" })).toBe(s); // nothing to dismiss
  });

  it("caps the queue so a flood cannot pile up", () => {
    let s = room;
    for (let i = 0; i < 20; i++) s = reducer(s, { type: "DEV_GRANT", knowledge: 1 });
    expect(s.banners.length).toBeLessThanOrEqual(MAX_BANNERS);
  });

  it("starts a return visit with the greeting waiting, and clears everything on reset", () => {
    const splash: AppState = { ...initialState, entered: false, layer: "splash" };
    const entered = reducer(splash, { type: "ENTER" });
    expect(entered.banners.map((b) => b.text)).toEqual(["Ah, you're back."]);
    expect(reducer(entered, { type: "RESET" }).banners).toEqual([]);
  });
});

describe("level gifts (spec §3.4: no empty level-ups)", () => {
  it("a level that gives a stamp, a tip or a remark announces it right after the level", () => {
    const base = run([{ type: "DEV_GRANT", knowledge: 125 - 10 }]); // level 3, just short of 4
    const stamp = texts(base, run([{ type: "DEV_GRANT", knowledge: 10 }], base)); // → level 4
    expect(stamp).toEqual(["+10 Knowledge", "Level 4", "A new stamp for your calendar: star."]);
    const tip = texts(run([{ type: "DEV_GRANT", knowledge: 215 }]), run([{ type: "DEV_GRANT", knowledge: 215 + 120 }])); // level 5 → 6
    expect(tip).toEqual(["+120 Knowledge", "Level 6", "Tip: write the first line of an answer before you check your notes."]);
  });

  it("a level that unlocks a location gives its notice (Ares's line), not a second gift line", () => {
    const base = run([{ type: "DEV_GRANT", knowledge: 34 }]);
    const out = texts(base, run([{ type: "DEV_GRANT", knowledge: 1 }], base)); // level 2 → 3, Ryuji
    expect(out).toEqual(["+1 Knowledge", "Level 3", "You unlocked a new location. Someone's waiting for you."]);
  });

  it("jumping several levels at once announces each level's gift, in order", () => {
    const out = texts(room, run([{ type: "DEV_GRANT", knowledge: 335 }])); // level 1 → 6
    expect(out).toEqual([
      "+335 Knowledge", "Level 6",
      "Morgana: There's a map now. Don't wander off.", "A new stamp for your calendar: star.", "Tip: write the first line of an answer before you check your notes.",
      "You unlocked a new location. Someone's waiting for you.",
    ]);
  });
});

describe("the banner queue the player actually sees", () => {
  const queue = (actions: Action[]) => run(actions).banners.map((b) => b.text);
  const MAP = "Morgana: There's a map now. Don't wander off.";
  const UNLOCK = "You unlocked a new location. Someone's waiting for you.";

  it("a first session of two hours crosses three levels and keeps every notice, Knowledge and level included", () => {
    expect(queue([{ type: "DEV_GRANT", knowledge: 125 }])).toEqual(["+125 Knowledge", "Level 4", MAP, "A new stamp for your calendar: star.", UNLOCK]);
  });

  it("a bigger jump keeps all of it too", () => {
    expect(queue([{ type: "DEV_GRANT", knowledge: 335 }])).toEqual(["+335 Knowledge", "Level 6", MAP, "A new stamp for your calendar: star.", "Tip: write the first line of an answer before you check your notes.", UNLOCK]);
  });

  it("a flood is capped, and what is dropped is the oldest, never the newest news", () => {
    let s = room;
    for (let i = 0; i < 40; i++) s = reducer(s, { type: "DEV_GRANT", knowledge: 1 });
    expect(s.banners.length).toBeLessThanOrEqual(MAX_BANNERS);
    expect(s.banners.at(-1)!.id).toContain(`knowledge-${derive(s).knowledge}`);
  });
});
