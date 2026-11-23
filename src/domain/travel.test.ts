import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { motion } from "@/motion/tokens";
import { PRELOAD_TIMEOUT_MS, initialTravel, preload, travelStep, travelTimings, type TravelEvent, type TravelState } from "./travel";

const run = (events: TravelEvent["type"][], from: TravelState = initialTravel) => events.reduce<TravelState>((s, type) => travelStep(s, { type }), from);

describe("travelStep", () => {
  it("starts covering the screen", () => {
    expect(initialTravel).toEqual({ phase: "covering", holdElapsed: false, assetsReady: false });
  });

  it("goes covering → title → revealing → done, in order", () => {
    const phases: string[] = [initialTravel.phase];
    let s = initialTravel;
    for (const type of ["COVERED", "ASSETS_READY", "HOLD_ELAPSED", "REVEALED"] as const) { s = travelStep(s, { type }); phases.push(s.phase); }
    expect(phases).toEqual(["covering", "title", "title", "revealing", "done"]);
  });

  it("the title card stays until BOTH the hold and the images are done, whichever comes later", () => {
    const afterCover = run(["COVERED"]);
    expect(run(["HOLD_ELAPSED"], afterCover).phase).toBe("title"); // hold done, images not
    expect(run(["ASSETS_READY"], afterCover).phase).toBe("title"); // images done, hold not
    expect(run(["HOLD_ELAPSED", "ASSETS_READY"], afterCover).phase).toBe("revealing"); // hold last... images last
    expect(run(["ASSETS_READY", "HOLD_ELAPSED"], afterCover).phase).toBe("revealing");
  });

  it("images that arrive while the screen is still being covered are remembered, and do not shorten the hold", () => {
    const early = run(["ASSETS_READY"]);
    expect(early).toEqual({ phase: "covering", holdElapsed: false, assetsReady: true });
    const onCard = travelStep(early, { type: "COVERED" });
    expect(onCard.phase).toBe("title"); // still held: the hold timer has not run
    expect(run(["HOLD_ELAPSED"], onCard).phase).toBe("revealing");
  });

  it("a hold timer from the wrong phase is ignored (it cannot end the card early)", () => {
    expect(run(["HOLD_ELAPSED"]).holdElapsed).toBe(false); // still covering
    const revealing = run(["COVERED", "ASSETS_READY", "HOLD_ELAPSED"]);
    expect(travelStep(revealing, { type: "HOLD_ELAPSED" })).toBe(revealing);
  });

  it("events out of order or after the end change nothing", () => {
    expect(run(["REVEALED"])).toBe(initialTravel); // nothing to reveal yet
    const done = run(["COVERED", "ASSETS_READY", "HOLD_ELAPSED", "REVEALED"]);
    for (const type of ["COVERED", "HOLD_ELAPSED", "ASSETS_READY", "REVEALED"] as const) expect(travelStep(done, { type })).toBe(done);
    expect(travelStep(run(["COVERED"]), { type: "COVERED" }).phase).toBe("title"); // covered twice is covered once
  });

  it("does not change the state it was given", () => {
    const s = Object.freeze({ ...initialTravel });
    expect(() => travelStep(s, { type: "COVERED" })).not.toThrow();
    expect(s).toEqual(initialTravel);
  });
});

describe("travelTimings", () => {
  it("the parts add up to the spec's 1.2–1.6 s", () => {
    const t = travelTimings(false);
    expect(t.cover + t.hold + t.reveal).toBe(motion.travel);
    expect(t.cover + t.hold + t.reveal).toBeGreaterThanOrEqual(1200);
    expect(t.cover + t.hold + t.reveal).toBeLessThanOrEqual(1600);
  });

  it("with reduced motion the two wipes become 100 ms cuts, and the card still holds (the next place loads inside it)", () => {
    const t = travelTimings(true);
    expect(t.cover).toBe(100);
    expect(t.reveal).toBe(100);
    expect(t.hold).toBe(motion.travelHold);
  });
});

describe("preload", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resolves at once when there is nothing to load", async () => {
    const load = vi.fn();
    await preload([], load);
    expect(load).not.toHaveBeenCalled();
  });

  it("loads every url, and resolves when all are done", async () => {
    const loaded: string[] = [];
    const load = (url: string) => new Promise<void>((resolve) => setTimeout(() => { loaded.push(url); resolve(); }, url === "slow.png" ? 500 : 100));
    let done = false;
    void preload(["a.png", "slow.png"], load).then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(200);
    expect(done).toBe(false); // the slow one is still coming
    await vi.advanceTimersByTimeAsync(400);
    expect(done).toBe(true);
    expect(loaded.sort()).toEqual(["a.png", "slow.png"]);
  });

  it("a failed image is a missing image: it still resolves, and never rejects", async () => {
    await expect(preload(["bad.png", "ok.png"], (url) => (url === "bad.png" ? Promise.reject(new Error("404")) : Promise.resolve()))).resolves.toBeUndefined();
  });

  it("gives up after the timeout so a slow load cannot trap the player on the title card", async () => {
    let done = false;
    void preload(["never.png"], () => new Promise<void>(() => undefined)).then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(PRELOAD_TIMEOUT_MS - 1);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toBe(true);
  });
});
