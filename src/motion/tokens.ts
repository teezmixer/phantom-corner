/**
 * Motion tokens (spec §3.10, DESIGN.md "Motion & Micro-interaction"). The same numbers live in `src/styles/tokens.css`
 * as CSS variables; `tokens.test.ts` fails if the two ever disagree, so CSS and JS cannot drift apart.
 * Only `transform`, `opacity` and `clip-path` are ever animated, and there are no crossfades.
 * DECISION: D-30 — the numbers marked PROPOSED in the spec (snap, hold, travel, stagger) are provisional.
 */
export const motion = {
  /** Hover, select, key press. PROPOSED. */
  snap: 120,
  /** The diagonal clip-path wipe that opens a screen. DECIDED (150–300 ms). */
  wipe: 200,
  /** Slabs and labels arriving. BUILT (the gate-in keyframe). */
  enter: 420,
  /** Delay between one label and the next as they fly in (spec: 40–80 ms). PROPOSED. */
  stagger: 60,
  /** The big location sign on arrival. PROPOSED. */
  hold: 900,
  /** Wipe out, title card, wipe in (spec: 1.2–1.6 s). PROPOSED. */
  travel: 1400,
  /** What a wipe becomes when motion is reduced. */
  reducedCut: 100,
} as const;

export const ENTER_EASING = "cubic-bezier(.2,.9,.3,1)";

/** CSS custom property name for each token, e.g. `snap` → `--motion-snap`. */
export const motionVar = (name: keyof typeof motion): string => `--motion-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
