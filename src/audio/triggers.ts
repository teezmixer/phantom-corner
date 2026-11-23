import type { AppState } from "@/state/store";
import type { SfxId } from "./sfx";

/**
 * Which interface sounds a state change should play. Pure, so the audio rules are testable:
 * - nothing plays at load (prev === next on the first call) and nothing unprompted;
 * - the doorbell is for a first-ever arrival; the completion fanfare is the one loud moment (spec §3.9).
 * Menu clicks and the like are handled where the click happens (AudioProvider).
 */
export function sfxFor(prev: AppState, next: AppState): SfxId[] {
  if (prev === next) return [];
  const out: SfxId[] = [];

  if (!prev.entered && next.entered && next.firstVisit) out.push("doorbell");

  if (prev.layer !== next.layer) {
    if (next.layer === "menu") out.push("menuOpen");
    else if (prev.layer === "menu") out.push("menuClose");
    if (next.layer === "travel") out.push("travel");
  }

  const wasRunning = prev.timer.status === "running";
  if (!wasRunning && next.timer.status === "running" && prev.timer.status !== "paused") out.push("sessionStart");

  // The mission is ticked done (not un-ticked), and a break that ran out (not one that was skipped).
  if (next.missionsDone > prev.missionsDone) out.push("missionDone"); // only a tick on this device: a sync or a load that brings "done" in makes no sound
  if (prev.lastBreak !== "ended" && next.lastBreak === "ended") out.push("breakEnd");

  // A newly recorded completed session. Compare lengths so reloading with old events plays nothing.
  if (next.events.length > prev.events.length) {
    const added = next.events.slice(prev.events.length);
    if (added.some((e) => e.kind === "session" && e.outcome === "completed")) out.push("sessionComplete");
  }
  return out;
}
