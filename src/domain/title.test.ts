import { describe, expect, it } from "vitest";
import { MINUTE, initialTimer, transition } from "./timer";
import { tabTitle } from "./title";

const T0 = 5_000_000;

describe("tabTitle", () => {
  it("is the plain name when idle or complete", () => {
    expect(tabTitle(initialTimer, T0)).toBe("Phantom Corner");
    expect(tabTitle({ status: "complete", durationMs: MINUTE }, T0)).toBe("Phantom Corner");
  });

  it("counts down while running", () => {
    const running = transition(initialTimer, { type: "START", now: T0 });
    expect(tabTitle(running, T0)).toBe("25:00 · Phantom Corner");
    expect(tabTitle(running, T0 + 90_000)).toBe("23:30 · Phantom Corner");
    expect(tabTitle(running, T0 + 25 * MINUTE)).toBe("00:00 · Phantom Corner");
  });

  it("says Paused with the time left", () => {
    const paused = transition(transition(initialTimer, { type: "START", now: T0 }), { type: "PAUSE", now: T0 + 5 * MINUTE });
    expect(tabTitle(paused, T0 + 99 * MINUTE)).toBe("Paused 20:00 · Phantom Corner");
  });
});
