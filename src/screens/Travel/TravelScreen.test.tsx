import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { motion } from "@/motion/tokens";
import { initialState, type AppState } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { TravelScreen } from "./TravelScreen";

// Images are the one thing a test must control: which files a place needs, and when (or whether) they load.
const files = vi.hoisted(() => ({ urls: [] as string[], load: ((): Promise<void> => Promise.resolve()) as (url: string) => Promise<void> }));
vi.mock("@/content/assets", () => ({ imagesOf: () => files.urls }));
vi.mock("@/lib/loadImage", () => ({ loadImage: (url: string) => files.load(url) }));

const travelling: AppState = { ...initialState, layer: "travel", entered: true, travelTo: "ryuji" };

function show(patch: Partial<AppState> = {}) {
  let latest!: AppState;
  function Watch() { const { state } = useStore(); useEffect(() => { latest = state; }); return null; }
  render(<StoreProvider initial={{ ...travelling, ...patch }}><TravelScreen /><Watch /></StoreProvider>);
  return { state: () => latest };
}
const phase = () => screen.getByRole("status").getAttribute("data-phase");
/** Let time pass the way a real clock does: in small steps, with React (and any promise) free to run between them. Each phase's timer is only set once the phase before it has rendered, and images arrive as promises. */
const tick = async (ms: number) => { for (let left = ms; left > 0; left -= 25) await act(async () => { vi.advanceTimersByTime(Math.min(25, left)); await Promise.resolve(); await Promise.resolve(); }); };
const settleMicrotasks = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

describe("TravelScreen", () => {
  beforeEach(() => { vi.useFakeTimers(); files.urls = []; files.load = () => Promise.resolve(); });
  afterEach(() => vi.useRealTimers());

  it("runs covering, then the title card, then revealing, then arrives, in that order and at those times", async () => {
    const s = show();
    await settleMicrotasks();
    const seen = [phase()];
    await tick(motion.travelCover - 1); expect(phase()).toBe("covering");
    await tick(1); seen.push(phase());
    await tick(motion.travelHold - 1); expect(phase()).toBe("title");
    await tick(1); seen.push(phase());
    expect(s.state().layer).toBe("travel"); // still going: the wipe is uncovering the room
    await tick(motion.travelReveal); await settleMicrotasks();
    expect(seen).toEqual(["covering", "title", "revealing"]);
    expect(s.state()).toMatchObject({ layer: "main", travelTo: null, locationId: "ryuji" });
  });

  it("the whole thing takes the spec's travel time", async () => {
    const s = show();
    await settleMicrotasks();
    await tick(motion.travel - 1);
    expect(s.state().layer).toBe("travel");
    await tick(1); await settleMicrotasks();
    expect(s.state().layer).toBe("main");
  });

  it("the destination becomes the current place when the reveal begins, so the wipe shows its room", async () => {
    const s = show();
    await settleMicrotasks();
    await tick(motion.travelCover + motion.travelHold - 1);
    expect(s.state().locationId).toBe("leblanc"); // still where we were, behind the card
    await tick(1);
    expect(s.state().locationId).toBe("ryuji");
    expect(s.state().visited).toContain("ryuji");
  });

  it("the card announces where we are going, with its register", async () => {
    show();
    await settleMicrotasks();
    await tick(motion.travelCover);
    expect(screen.getByText("School rooftop")).toBeInTheDocument();
    expect(screen.getByText("Loose, open air, short sprints")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  describe("the next place's images", () => {
    it("hold the title card past its time until they are in, and a line keeps moving meanwhile", async () => {
      let finish!: () => void;
      files.urls = ["scene.png"];
      files.load = () => new Promise<void>((resolve) => { finish = resolve; });
      const s = show();
      await settleMicrotasks();
      await tick(motion.travelCover + motion.travelHold + 3000); // far past the hold
      expect(phase()).toBe("title");
      expect(screen.getByRole("status").querySelector("[class*='animate-travel-motif']")).not.toBeNull(); // the moving line
      finish(); await settleMicrotasks();
      expect(phase()).toBe("revealing");
      await tick(motion.travelReveal); await settleMicrotasks();
      expect(s.state().layer).toBe("main");
    });

    it("that load inside the hold cost no extra time", async () => {
      files.urls = ["scene.png"];
      files.load = () => new Promise<void>((resolve) => setTimeout(resolve, 200));
      const s = show();
      await settleMicrotasks();
      await tick(motion.travel); await settleMicrotasks();
      expect(s.state().layer).toBe("main"); // the 200 ms load fitted inside the 800 ms hold
    });

    it("that fail to load do not trap the player on the card", async () => {
      files.urls = ["broken.png"];
      files.load = () => Promise.reject(new Error("404"));
      const s = show();
      await settleMicrotasks();
      await tick(motion.travel); await settleMicrotasks();
      expect(s.state().layer).toBe("main");
    });
  });

  describe("with reduced motion", () => {
    it("the two wipes are 100 ms cuts, and the card still holds for the images", async () => {
      const s = show({ motion: "reduced" });
      await settleMicrotasks();
      await tick(motion.reducedCut - 1); expect(phase()).toBe("covering");
      await tick(1); expect(phase()).toBe("title");
      await tick(motion.travelHold - 1); expect(phase()).toBe("title");
      await tick(1); expect(phase()).toBe("revealing");
      await tick(motion.reducedCut); await settleMicrotasks();
      expect(s.state().layer).toBe("main");
    });

    it("draws no wipe animation, and the waiting line stands still", async () => {
      files.urls = ["scene.png"];
      files.load = () => new Promise<void>(() => undefined);
      show({ motion: "reduced" });
      await settleMicrotasks();
      expect(screen.getByRole("status").querySelector("[class*='animate-travel']")).toBeNull();
      await tick(motion.reducedCut + motion.travelHold + 1);
      expect(screen.getByRole("status").querySelector("[class*='animate-travel']")).toBeNull(); // not even the moving line
    });

    it("takes less time than the full sequence", async () => {
      const s = show({ motion: "reduced" });
      await settleMicrotasks();
      await tick(motion.reducedCut * 2 + motion.travelHold); await settleMicrotasks();
      expect(motion.reducedCut * 2 + motion.travelHold).toBeLessThan(motion.travel);
      expect(s.state().layer).toBe("main");
    });
  });
});
