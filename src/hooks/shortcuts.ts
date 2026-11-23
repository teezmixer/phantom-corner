import type { Action, AppState, Derived } from "@/state/store";

/** True when the key press comes from something the user is typing into or operating directly. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

const DISMISSABLE = ["menu", "map", "settings", "profile", "about", "credits", "privacy"];

/**
 * Keyboard shortcuts (spec §3.6): Space start/pause, M menu, N map, H hide UI, S skip onboarding (while it runs), Esc closes any layer.
 * Pure: maps a key and the state to an action (or null). Off while typing in a field; modifier combos are ignored.
 */
export function shortcutAction(
  key: string,
  state: AppState,
  derived: Pick<Derived, "mapOpen">,
  now: number,
  mods: { typing: boolean; onButton?: boolean; ctrl?: boolean; meta?: boolean; alt?: boolean },
): Action | null {
  if (mods.ctrl || mods.meta || mods.alt) return null;
  if (key === "Escape") {
    if (DISMISSABLE.includes(state.layer)) return { type: "CLOSE_LAYER" };
    if (state.layer === "main" && state.phoneOpen) return { type: "SET_PHONE", open: false };
    return null;
  }
  if (mods.typing) return null;
  const k = key.toLowerCase();
  const inRoom = state.layer === "main";
  if (k === "m") {
    if (state.layer === "menu") return { type: "CLOSE_LAYER" };
    return inRoom ? { type: "SET_LAYER", layer: "menu" } : null;
  }
  if (k === "n") {
    if (state.layer === "map") return { type: "CLOSE_LAYER" };
    return inRoom && derived.mapOpen ? { type: "SET_LAYER", layer: "map" } : null;
  }
  if (k === "h") return inRoom ? { type: "TOGGLE_HUD" } : null;
  // S skips onboarding, at any point, while it is running (spec §3.5: one key).
  if (k === "s" && inRoom && state.story["morgana"] && !state.story["morgana"].done) return { type: "SKIP_ONBOARDING" };
  if (key === " " && inRoom && !mods.onButton) {
    const t = state.timer;
    if (t.status === "idle") return { type: "TIMER", event: { type: "START", now }, now };
    if (t.status === "running") return { type: "TIMER", event: { type: "PAUSE", now }, now };
    if (t.status === "paused") return { type: "TIMER", event: { type: "RESUME", now }, now };
    if (t.status === "complete") return { type: "START_SESSION", now };
  }
  return null;
}
