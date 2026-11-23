import { LOCATIONS } from "@/content/registry";
import { MAP_UNLOCK_LEVEL, SHIPPED_LOCATIONS } from "@/content/progression";
import { knowledgeFor, levelForKnowledge, unlockState } from "@/domain/progress";
import type { AppState } from "./store";

/** Values computed from state; never stored. */
export interface Derived {
  knowledge: number;
  level: number;
  unlocked: string[];
  /** Locations whose level is reached but which are not shipped yet: waiting, not unlocked (spec §3.4). */
  held: string[];
  mapOpen: boolean;
  sessions: number;
  minutesFocused: number;
}

export function derive(state: AppState): Derived {
  const knowledge = knowledgeFor(state.events);
  const level = levelForKnowledge(knowledge);
  const { unlocked, held } = state.devUnlockAll ? { unlocked: LOCATIONS.map((l) => l.id), held: [] } : unlockState(level, LOCATIONS, SHIPPED_LOCATIONS);
  const sessionEvents = state.events.filter((e) => e.kind === "session");
  return {
    knowledge,
    level,
    unlocked,
    held,
    mapOpen: state.devUnlockAll || level >= MAP_UNLOCK_LEVEL,
    sessions: sessionEvents.length,
    minutesFocused: Math.floor(sessionEvents.reduce((sum, e) => sum + e.focusedMs, 0) / 60_000),
  };
}

