import { LOCATIONS } from "@/content/registry";
import { SHIPPED_LOCATIONS } from "@/content/progression";
import { describe, expect, it } from "vitest";
import { knowledgeFor, levelForKnowledge, levelProgress, unlockState, unlockedIds, type ProgressEvent } from "./progress";

const T = [0, 10, 35, 125];

describe("levelForKnowledge", () => {
  it.each([
    [0, 1],
    [9, 1],
    [10, 2], // reaching a threshold exactly levels you up
    [34, 2],
    [35, 3],
    [124, 3],
    [125, 4],
    [10_000, 4], // never beyond the last level
  ])("%i Knowledge → level %i", (knowledge, level) => {
    expect(levelForKnowledge(knowledge, T)).toBe(level);
  });

  it("treats negative or missing Knowledge as level 1", () => {
    expect(levelForKnowledge(-5, T)).toBe(1);
    expect(levelForKnowledge(Number.NaN, T)).toBe(1);
  });

  it("uses the provisional curve by default (L2 at 10, L3 at 35)", () => {
    expect(levelForKnowledge(10)).toBe(2);
    expect(levelForKnowledge(35)).toBe(3);
  });
});

const full = (minutes: number): ProgressEvent => ({ kind: "session", plannedMs: minutes * 60_000, focusedMs: minutes * 60_000, outcome: "completed" });
const stopped = (minutes: number): ProgressEvent => ({ kind: "session", plannedMs: 25 * 60_000, focusedMs: minutes * 60_000, outcome: "stopped" });

describe("knowledgeFor", () => {
  it("starts at zero", () => expect(knowledgeFor([])).toBe(0));

  it("gives the first mission +10, once", () => {
    expect(knowledgeFor([{ kind: "mission_first_set" }])).toBe(10);
    expect(knowledgeFor([{ kind: "mission_first_set" }, { kind: "mission_first_set" }])).toBe(10);
  });

  it("gives 1 per focused minute plus 5 for a completed session", () => {
    expect(knowledgeFor([full(25)])).toBe(30);
  });

  it("counts a stopped session only from 5 minutes, with no bonus", () => {
    expect(knowledgeFor([stopped(4)])).toBe(0);
    expect(knowledgeFor([stopped(5)])).toBe(5);
    expect(knowledgeFor([stopped(12)])).toBe(12);
  });

  it("lets mission + first full session reach level 3 (Ryuji)", () => {
    const k = knowledgeFor([{ kind: "mission_first_set" }, full(25)]);
    expect(k).toBe(40);
    expect(levelForKnowledge(k)).toBe(3);
  });

  it("adds dev grants", () => expect(knowledgeFor([{ kind: "dev_grant", knowledge: 100 }])).toBe(100));
});

describe("unlockedIds", () => {
  const locs = [{ id: "a", unlockLevel: 1 }, { id: "b", unlockLevel: 3 }, { id: "c", unlockLevel: 5 }];
  it("returns locations at or below the level", () => {
    expect(unlockedIds(1, locs)).toEqual(["a"]);
    expect(unlockedIds(3, locs)).toEqual(["a", "b"]);
    expect(unlockedIds(9, locs)).toEqual(["a", "b", "c"]);
  });
});

describe("levelProgress", () => {
  it("reports progress through the current level", () => {
    expect(levelProgress(0, T)).toEqual({ into: 0, span: 10, percent: 0, maxed: false });
    expect(levelProgress(5, T)).toEqual({ into: 5, span: 10, percent: 50, maxed: false });
    expect(levelProgress(10, T)).toEqual({ into: 0, span: 25, percent: 0, maxed: false });
  });
  it("is full at the maximum level", () => {
    expect(levelProgress(9999, T)).toEqual({ into: 0, span: 0, percent: 100, maxed: true });
  });
});

describe("unlocks follow the data (fold over Knowledge → level → locations)", () => {
  const unlockedAt = (knowledge: number) => unlockState(levelForKnowledge(knowledge), LOCATIONS, SHIPPED_LOCATIONS).unlocked;

  it("whatever Knowledge a player has, the canon locations they can enter are the first few in canon order, never a gap", () => {
    const canon = LOCATIONS.filter((l) => !l.bonus).map((l) => l.id);
    for (let knowledge = 0; knowledge <= 6000; knowledge += 5) {
      const open = unlockedAt(knowledge).filter((id) => canon.includes(id));
      expect(open, `${knowledge} Knowledge`).toEqual(canon.slice(0, open.length));
      expect(open[0]).toBe("leblanc");
    }
  });

  it.each([
    [1, "leblanc"], [3, "ryuji"], [5, "ann"], [8, "yusuke"], [12, "makoto"], [16, "futaba"], [20, "haru"], [25, "akechi"],
  ])("the canon location that arrives at level %i is %s, and not before", (level, id) => {
    const at = unlockState(level, LOCATIONS, SHIPPED_LOCATIONS).unlocked;
    const before = unlockState(level - 1, LOCATIONS, SHIPPED_LOCATIONS).unlocked;
    expect(at).toContain(id);
    if (level > 1) expect(before).not.toContain(id);
  });

  it("the first mission plus the first completed 25-minute session is enough for Ryuji, and not for Ann", () => {
    const events: ProgressEvent[] = [{ kind: "mission_first_set" }, { kind: "session", plannedMs: 25 * 60_000, focusedMs: 25 * 60_000, outcome: "completed" }];
    const ids = unlockedAt(knowledgeFor(events));
    expect(ids).toContain("ryuji");
    expect(ids).not.toContain("ann");
  });

  it("the bonus locations follow one rule, in the data file: one per level after the last canon unlock, in order", () => {
    const levels = Object.fromEntries(LOCATIONS.filter((l) => l.bonus).map((l) => [l.id, l.unlockLevel]));
    expect(levels).toEqual({ "rainy-walk": 26, subway: 27, "velvet-room": 28, mementos: 29 });
    // Reached through Knowledge, with nothing else involved.
    const grant = (knowledge: number): ProgressEvent[] => [{ kind: "dev_grant", knowledge }];
    expect(unlockedAt(knowledgeFor(grant(4320)))).not.toContain("rainy-walk"); // level 25
    expect(unlockedAt(knowledgeFor(grant(4610)))).toContain("rainy-walk"); // level 26
    expect(unlockedAt(knowledgeFor(grant(4610)))).not.toContain("subway");
    expect(unlockedAt(knowledgeFor(grant(5480)))).toEqual(expect.arrayContaining(["subway", "velvet-room", "mementos"])); // level 29
  });

  it("a user who outruns the content: a location that is not shipped is held, not unlocked, until it ships", () => {
    const withoutAnn = SHIPPED_LOCATIONS.filter((id) => id !== "ann");
    const held = unlockState(8, LOCATIONS, withoutAnn);
    expect(held.unlocked).not.toContain("ann");
    expect(held.held).toEqual(["ann"]);
    expect(held.unlocked).toEqual(expect.arrayContaining(["leblanc", "ryuji", "yusuke"])); // others are unaffected
    const shipped = unlockState(8, LOCATIONS, SHIPPED_LOCATIONS); // the day it goes live
    expect(shipped.unlocked).toContain("ann");
    expect(shipped.held).toEqual([]);
  });

  it("nothing is held when everything reached is shipped, and a location below the level is never both", () => {
    const state = unlockState(29, LOCATIONS, SHIPPED_LOCATIONS);
    expect(state.held).toEqual([]);
    expect(new Set([...state.unlocked, ...state.held]).size).toBe(state.unlocked.length + state.held.length);
  });
});
