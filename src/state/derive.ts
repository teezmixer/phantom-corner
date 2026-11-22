import { LOCATIONS } from "@/content/registry";
import { MAP_UNLOCK_LEVEL } from "@/content/progression";
import { knowledgeFor, levelForKnowledge, unlockedIds } from "@/domain/progress";
import type { AppState } from "./store";

/** Values computed from state; never stored. */
export interface Derived {
  knowledge: number;
  level: number;
  unlocked: string[];
  mapOpen: boolean;
  sessions: number;
  minutesFocused: number;
}

export function derive(state: AppState): Derived {
  const knowledge = knowledgeFor(state.events);
  const level = levelForKnowledge(knowledge);
  const unlocked = state.devUnlockAll ? LOCATIONS.map((l) => l.id) : unlockedIds(level, LOCATIONS);
  const sessionEvents = state.events.filter((e) => e.kind === "session");
  return {
    knowledge,
    level,
    unlocked,
    mapOpen: state.devUnlockAll || level >= MAP_UNLOCK_LEVEL,
    sessions: sessionEvents.length,
    minutesFocused: Math.floor(sessionEvents.reduce((sum, e) => sum + e.focusedMs, 0) / 60_000),
  };
}

