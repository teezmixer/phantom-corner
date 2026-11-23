import { describe, expect, it } from "vitest";
import { levelRewards } from "./copy";
import { BONUS_UNLOCK_LEVELS, LEVEL_REWARDS, LEVEL_THRESHOLDS, MAP_UNLOCK_LEVEL, SHIPPED_LOCATIONS, STAMP_STYLES, UNLOCK_LEVELS } from "./progression";
import { LOCATIONS } from "./registry";

const MAX_LEVEL = LEVEL_THRESHOLDS.length;

describe("progression data", () => {
  it("the level curve starts at 0, rises every level, and runs far enough for the bonus locations", () => {
    expect(LEVEL_THRESHOLDS[0]).toBe(0);
    LEVEL_THRESHOLDS.slice(1).forEach((t, i) => expect(t).toBeGreaterThan(LEVEL_THRESHOLDS[i]!));
    expect(MAX_LEVEL).toBeGreaterThanOrEqual(Math.max(...Object.values(BONUS_UNLOCK_LEVELS)));
  });

  it("every level from 2 to the maximum gives something (spec §3.4: no empty level-ups), and level 1 gives nothing", () => {
    for (let level = 2; level <= MAX_LEVEL; level++) expect(LEVEL_REWARDS[level], `level ${level}`).toBeDefined();
    expect(LEVEL_REWARDS[1]).toBeUndefined();
    expect(Object.keys(LEVEL_REWARDS).map(Number).filter((l) => l > MAX_LEVEL)).toEqual([]);
  });

  it("an unlock reward sits exactly on the levels that unlock a location, and nowhere else", () => {
    const unlockLevels = [...Object.values(UNLOCK_LEVELS).filter((l) => l > 1), ...Object.values(BONUS_UNLOCK_LEVELS)].sort((a, b) => a - b);
    const rewardLevels = Object.entries(LEVEL_REWARDS).filter(([, r]) => r.kind === "unlock").map(([l]) => Number(l)).sort((a, b) => a - b);
    expect(rewardLevels).toEqual(unlockLevels);
  });

  it("the map reward is on the map's level", () => {
    expect(Object.entries(LEVEL_REWARDS).filter(([, r]) => r.kind === "map").map(([l]) => Number(l))).toEqual([MAP_UNLOCK_LEVEL]);
  });

  it("every reward that is not an unlock has its wording in content/copy, and unlock levels have none (their notice is Ares's line)", () => {
    for (const [level, reward] of Object.entries(LEVEL_REWARDS)) {
      if (reward.kind === "unlock") expect(levelRewards[Number(level)], `level ${level}`).toBeUndefined();
      else expect(levelRewards[Number(level)]?.length, `level ${level}`).toBeGreaterThan(0);
    }
  });

  it("each stamp reward unlocks the next calendar stamp design, in order, and every design is earned", () => {
    const stamps = Object.entries(LEVEL_REWARDS).filter(([, r]) => r.kind === "stamp").sort(([a], [b]) => Number(a) - Number(b)).map(([, r]) => (r.kind === "stamp" ? r.style : null));
    expect(stamps).toEqual(STAMP_STYLES.slice(1)); // style 0 is the default; the rest come from rewards
  });

  it("holds no unlock for a location that does not exist, and ships only real locations", () => {
    const ids = LOCATIONS.map((l) => l.id);
    for (const id of SHIPPED_LOCATIONS) expect(ids).toContain(id);
    expect(new Set(SHIPPED_LOCATIONS).size).toBe(SHIPPED_LOCATIONS.length);
  });

  it("all twelve locations are shipped for now, so all are reachable on the map", () => {
    expect([...SHIPPED_LOCATIONS].sort()).toEqual(LOCATIONS.map((l) => l.id).sort());
  });
});
