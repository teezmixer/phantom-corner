import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as copy from "./copy";
import { LOCATIONS, type Location } from "./registry";
import { THREADS } from "./threads";
import { MIN_LINES_PER_GROUP, contentProblems, type CheckedLocation } from "./validate";

const publicDir = resolve(import.meta.dirname, "../../public");
const imageExists = (src: string) => existsSync(resolve(publicDir, src.replace(/^\//, "")));

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

  it("gives every location at least three lines per group (spec §4.6)", () => {
    for (const l of LOCATIONS) {
      for (const [group, lines] of Object.entries(l.lines)) {
        expect(lines.length, `${l.id}.${group}`).toBeGreaterThanOrEqual(MIN_LINES_PER_GROUP);
      }
    }
  });

  it("passes every content rule: ids, canon order, unlock order, images and alt text, lines, track ids, thread targets", () => {
    expect(contentProblems(LOCATIONS, { imageExists, threads: THREADS.map((t) => ({ id: t.id, trigger: t.trigger })) })).toEqual([]);
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

/** The content rules must be able to fail: each case breaks exactly one rule on a copy of real content. */
describe("content rules catch broken content", () => {
  const base = (): CheckedLocation[] => structuredClone(LOCATIONS) as unknown as Location[];
  const problems = (locations: CheckedLocation[], threads: { id: string; trigger?: { on: string; location?: string } }[] = []) => contentProblems(locations, { imageExists: () => true, threads });
  const at = (locations: CheckedLocation[], id: string) => locations.find((l) => l.id === id)!;

  it("the untouched copy is clean", () => expect(problems(base())).toEqual([]));

  it("two ids collide", () => {
    const l = base(); l[1]!.id = l[0]!.id;
    expect(problems(l).join("\n")).toMatch(/two locations have the id "leblanc"/);
  });

  it("a canon index is missing", () => {
    const l = base(); at(l, "yusuke").canonIndex = 9;
    expect(problems(l).join("\n")).toMatch(/canon indices are not 0\.\.7/);
  });

  it("an unlock level is not higher than the previous location's", () => {
    const l = base(); at(l, "ann").unlockLevel = 3;
    expect(problems(l).join("\n")).toMatch(/"ann" unlocks at level 3, which is not higher than "ryuji"/);
  });

  it("an image has no alt text", () => {
    const l = base(); at(l, "leblanc").scene = { poster: { src: "/a.png", width: 1, height: 1, alt: " " } };
    expect(problems(l).join("\n")).toMatch(/"leblanc" scene.poster has no alt text/);
  });

  it("an image file is missing", () => {
    const l = base(); at(l, "leblanc").sign = { src: "/nope.png", width: 1, height: 1, alt: "A sign" };
    expect(contentProblems(l, { imageExists: () => false }).join("\n")).toMatch(/"leblanc" sign points at \/nope.png, which does not exist/);
  });

  it("a group is missing altogether, not just short", () => {
    const l = base(); delete (at(l, "ann").lines as unknown as Record<string, unknown>).idle;
    (at(l, "ann").lines as unknown as Record<string, unknown>).arrive = undefined;
    const text = problems(l).join("\n");
    expect(text).toMatch(/"ann" has no idle lines at all/);
    expect(text).toMatch(/"ann" has no arrive lines at all/);
  });

  it("a group has fewer than three lines, or an empty one", () => {
    const l = base(); at(l, "ann").lines.idle = ["One.", "Two."];
    at(l, "haru").lines.start = ["a", "", "c"];
    const text = problems(l).join("\n");
    expect(text).toMatch(/"ann" has 2 idle line\(s\)/);
    expect(text).toMatch(/"haru" has an empty start line/);
  });

  it("a track id is not eleven characters", () => {
    const l = base(); at(l, "leblanc").playlist = [{ videoId: "short", title: "Bad", source: "rights-holder", checkedOn: "2026-01-01" }];
    expect(problems(l).join("\n")).toMatch(/track "Bad" has the id "short"/);
  });

  it("a thread refers to a location that does not exist", () => {
    expect(problems(base(), [{ id: "x-unlock", trigger: { on: "unlock", location: "atlantis" } }]).join("\n")).toMatch(/thread "x-unlock" refers to the location "atlantis"/);
  });

  it("two locations claim the same thread", () => {
    const l = base(); at(l, "ann").threads = { unlock: "ryuji-unlock" };
    expect(problems(l).join("\n")).toMatch(/thread "ryuji-unlock" is claimed by both "ryuji" and "ann"/);
  });
});

describe("the phone's threads", () => {
  it("every thread that names a location names one that exists (this is not vacuous: the threads carry triggers)", () => {
    const named = THREADS.filter((t) => t.trigger && "location" in t.trigger);
    expect(named.length).toBeGreaterThanOrEqual(7); // the seven characters who send an unlock message
    expect(contentProblems(LOCATIONS, { imageExists, threads: THREADS.map((t) => ({ id: t.id, trigger: t.trigger })) })).toEqual([]);
  });

  it("an unlock thread for a location that is not in the registry would fail the build", () => {
    const broken = THREADS.map((t) => (t.id === "ryuji" ? { id: t.id, trigger: { on: "unlock", location: "rooftop" } } : { id: t.id, trigger: t.trigger }));
    expect(contentProblems(LOCATIONS, { imageExists, threads: broken }).join("\n")).toMatch(/thread "ryuji" refers to the location "rooftop"/);
  });
});
