import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ENTER_EASING, motion, motionVar } from "./tokens";

// Read from disk: Vitest replaces imported CSS with an empty string.
const css = readFileSync(resolve(import.meta.dirname, "../styles/tokens.css"), "utf8");

describe("motion tokens", () => {
  it.each(Object.entries(motion))("%s is the same number in TypeScript and in tokens.css", (name, ms) => {
    const found = new RegExp(`${motionVar(name as keyof typeof motion)}:\\s*(\\d+)ms;`).exec(css);
    expect(found?.[1], `${motionVar(name as keyof typeof motion)} is missing from tokens.css`).toBe(String(ms));
  });

  it("the enter easing is the same in both", () => {
    expect(css).toContain(`--motion-enter-easing: ${ENTER_EASING};`);
  });

  it("keeps the spec's ranges: wipe 150–300 ms, stagger 40–80 ms, travel 1.2–1.6 s", () => {
    expect(motion.wipe).toBeGreaterThanOrEqual(150);
    expect(motion.wipe).toBeLessThanOrEqual(300);
    expect(motion.stagger).toBeGreaterThanOrEqual(40);
    expect(motion.stagger).toBeLessThanOrEqual(80);
    expect(motion.travel).toBeGreaterThanOrEqual(1200);
    expect(motion.travel).toBeLessThanOrEqual(1600);
  });

  it("the three parts of travel add up to the whole", () => {
    expect(motion.travelCover + motion.travelHold + motion.travelReveal).toBe(motion.travel);
  });
});
