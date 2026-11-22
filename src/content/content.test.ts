import { describe, expect, it } from "vitest";
import * as copy from "./copy";
import { LOCATIONS } from "./registry";

describe("content registry", () => {
  it("registers the eight canon and four bonus locations", () => {
    expect(LOCATIONS.filter((l) => !l.bonus)).toHaveLength(8);
    expect(LOCATIONS.filter((l) => l.bonus).map((l) => l.id).sort()).toEqual(
      ["mementos", "rainy-walk", "subway", "velvet-room"],
    );
  });

  it("has unique ids", () => {
    const ids = LOCATIONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps canon order 0–7 without gaps, starting at LeBlanc", () => {
    const canon = LOCATIONS.filter((l) => !l.bonus);
    expect(canon.map((l) => l.canonIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(canon[0]?.id).toBe("leblanc");
  });

  it("unlocks each location at a higher level than the one before", () => {
    const levels = LOCATIONS.map((l) => l.unlockLevel);
    levels.slice(1).forEach((lvl, i) => expect(lvl).toBeGreaterThan(levels[i]!));
  });

  it("gives every location at least one line per group", () => {
    for (const l of LOCATIONS) {
      for (const [group, lines] of Object.entries(l.lines)) {
        expect(lines.length, `${l.id}.${group}`).toBeGreaterThan(0);
      }
    }
  });

  it("never uses a banned SaaS phrase (spec §3.8)", () => {
    const strings = [
      ...LOCATIONS.flatMap((l) => Object.values(l.lines).flat()),
      ...Object.values(copy).flatMap((group) => (typeof group === "object" && !Array.isArray(group) ? Object.values(group).flat() : [])),
    ].filter((s): s is string => typeof s === "string");
    for (const s of strings) {
      for (const banned of copy.BANNED_PHRASES) expect(s, s).not.toContain(banned);
    }
  });

  it("keeps Ares's verbatim lines", () => {
    expect(copy.sojiro.back).toBe("Ah, you're back.");
    expect(copy.widgets.missionEmpty).toBe("What's today's mission?");
  });
});
