/**
 * Travel (spec §3.10, §4.10): a small state machine of its own, `covering → title → revealing → done`. A red wipe covers the
 * screen; the destination's title card is held on black while its images load; a wipe then reveals the room. The title phase
 * waits for TWO things, the hold timer and the images, whichever comes later, so travel never needs a spinner. Pure: no timers,
 * no DOM. The screen feeds it events as its timers fire and as the images arrive.
 */
import { motion } from "@/motion/tokens";

export type TravelPhase = "covering" | "title" | "revealing" | "done";

export interface TravelState {
  phase: TravelPhase;
  /** The title card has been held for its minimum time. */
  holdElapsed: boolean;
  /** The next place's images are in (or loading gave up). */
  assetsReady: boolean;
}

export type TravelEvent = { type: "COVERED" } | { type: "HOLD_ELAPSED" } | { type: "ASSETS_READY" } | { type: "REVEALED" };

export const initialTravel: TravelState = { phase: "covering", holdElapsed: false, assetsReady: false };

/** The title phase ends when both the hold and the images are done. */
const settle = (state: TravelState): TravelState =>
  state.phase === "title" && state.holdElapsed && state.assetsReady ? { ...state, phase: "revealing" } : state;

export function travelStep(state: TravelState, event: TravelEvent): TravelState {
  switch (event.type) {
    case "COVERED":
      return state.phase === "covering" ? settle({ ...state, phase: "title" }) : state;
    case "HOLD_ELAPSED":
      // Only the title card's own timer counts: a stale one from another phase must not end the hold early.
      return state.phase === "title" && !state.holdElapsed ? settle({ ...state, holdElapsed: true }) : state;
    case "ASSETS_READY":
      // The images may arrive before the title card is even up; remember it.
      return state.phase !== "done" && !state.assetsReady ? settle({ ...state, assetsReady: true }) : state;
    case "REVEALED":
      return state.phase === "revealing" ? { ...state, phase: "done" } : state;
  }
}

export interface TravelTimings {
  /** The red wipe that covers the screen. */
  cover: number;
  /** The least the title card is held. */
  hold: number;
  /** The wipe that reveals the room. */
  reveal: number;
}

/** Milliseconds for each part. Reduced motion turns the two wipes into 100 ms cuts; the card still holds, because the next place loads inside it. */
export function travelTimings(reduced: boolean): TravelTimings {
  return reduced
    ? { cover: motion.reducedCut, hold: motion.travelHold, reveal: motion.reducedCut }
    : { cover: motion.travelCover, hold: motion.travelHold, reveal: motion.travelReveal };
}

/** If the images take longer than this the card moves on anyway: a slow or failed load must never trap the player. */
export const PRELOAD_TIMEOUT_MS = 8000;

/**
 * Load every url with `load` and resolve when they are all done, or when `timeoutMs` has passed, whichever is first. Never
 * rejects: a failed image is a missing image, not a reason to stay on the title card.
 */
export function preload(urls: readonly string[], load: (url: string) => Promise<void>, timeoutMs: number = PRELOAD_TIMEOUT_MS): Promise<void> {
  if (urls.length === 0) return Promise.resolve();
  const all = Promise.all(urls.map((url) => load(url).catch(() => undefined))).then(() => undefined);
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    void all.then(() => { clearTimeout(timer); resolve(); });
  });
}
