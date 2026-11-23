import { describe, expect, it, vi } from "vitest";

// A world where Ann's location has not shipped yet.
vi.mock("@/content/progression", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/content/progression")>();
  return { ...real, SHIPPED_LOCATIONS: real.SHIPPED_LOCATIONS.filter((id) => id !== "ann") };
});

const { derive } = await import("./derive");
const { bannersFor } = await import("./banners");
const { initialState, reducer } = await import("./store");
import type { AppState } from "./store";

const room: AppState = { ...initialState, entered: true, layer: "main" };
const grant = (from: AppState, knowledge: number) => reducer(from, { type: "DEV_GRANT", knowledge });

describe("a user who outruns the content (spec §3.4)", () => {
  const atRyuji = grant(room, 40); // level 3
  const atAnn = grant(atRyuji, 175); // 215 Knowledge: level 5, where Ann waits

  it("reaching Ann's level holds her location: it is not unlocked, and is reported as held", () => {
    expect(derive(atAnn).level).toBe(5);
    expect(derive(atAnn).unlocked).not.toContain("ann");
    expect(derive(atAnn).held).toEqual(["ann"]);
    expect(derive(atAnn).unlocked).toContain("ryuji"); // everything else is unaffected
  });

  it("the level-up hints that someone has been asking, and does not use the unlock line", () => {
    const texts = bannersFor(atRyuji, atAnn).map((b) => b.text);
    expect(texts).toContain("Someone's been asking about you. Not yet — but soon.");
    expect(texts).not.toContain("You unlocked a new location. Someone's waiting for you.");
  });

  it("the hint is given once, not again at every later change", () => {
    const later = grant(atAnn, 1);
    expect(bannersFor(atAnn, later).map((b) => b.text)).not.toContain("Someone's been asking about you. Not yet — but soon.");
  });
});
