import { describe, expect, it } from "vitest";
import { knowledgeFor, levelForKnowledge, levelProgress, unlockedIds, type ProgressEvent } from "./progress";

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
