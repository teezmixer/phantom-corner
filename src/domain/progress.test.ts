import { describe, expect, it } from "vitest";
import { levelForKnowledge } from "./progress";

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
