/**
 * Progress maths. Pure functions only — no React, no storage (spec §4.3 domain/).
 * Numbers come from content/progression.ts (provisional), never hard-coded here.
 */
import { KNOWLEDGE_RULES, LEVEL_THRESHOLDS } from "@/content/progression";

/**
 * The level a user is at for a given total of Knowledge.
 *
 * `thresholds[i]` is the total Knowledge needed to REACH level i + 1, so
 * thresholds = [0, 10, 35, …] means: 0–9 → level 1, 10–34 → level 2, 35+ → level 3, and so on.
 * Past the last threshold the level stays at the maximum (thresholds.length).
 */
export function levelForKnowledge(knowledge: number, thresholds: readonly number[] = LEVEL_THRESHOLDS): number {
  // Negative, NaN or missing Knowledge counts as the starting level.
  if (!Number.isFinite(knowledge) || knowledge < 0) return 1;
  // Level = how many thresholds the user has reached. thresholds[0] is 0, so everyone is at least level 1,
  // and the count stops at thresholds.length, which is the maximum level.
  return thresholds.filter((needed) => knowledge >= needed).length || 1;
}

/** An entry in the append-only event log. Knowledge is never stored; it is folded from these (spec §4.5). */
export type ProgressEvent =
  | { kind: "mission_first_set" }
  | { kind: "session"; plannedMs: number; focusedMs: number; outcome: "completed" | "stopped" }
  /** Dev panel only. */
  | { kind: "dev_grant"; knowledge: number };

/** Total Knowledge for an event log under the given rules. */
export function knowledgeFor(events: readonly ProgressEvent[], rules: typeof KNOWLEDGE_RULES = KNOWLEDGE_RULES): number {
  let total = 0;
  let firstMissionCounted = false;
  for (const event of events) {
    if (event.kind === "mission_first_set") {
      if (!firstMissionCounted) total += rules.firstMission;
      firstMissionCounted = true;
    } else if (event.kind === "dev_grant") {
      total += event.knowledge;
    } else {
      const minutes = Math.floor(event.focusedMs / 60_000);
      if (event.outcome === "completed") total += minutes * rules.perFocusedMinute + rules.completionBonus;
      else if (minutes >= rules.cutShortMinimumMinutes) total += minutes * rules.perFocusedMinute;
    }
  }
  return total;
}

/** Ids of the locations whose unlock level has been reached (shipped or not). */
export function unlockedIds(level: number, locations: readonly { id: string; unlockLevel: number }[]): string[] {
  return locations.filter((l) => l.unlockLevel <= level).map((l) => l.id);
}

/**
 * What the player can actually enter and what is waiting for the content to ship (spec §3.4). A location whose level is
 * reached but which is not in `shipped` is HELD: it is not unlocked until it ships. Canon and bonus locations follow the
 * same rule; each location's own `unlockLevel` (canon levels, and the one provisional bonus rule) is the only input.
 */
export function unlockState(
  level: number,
  locations: readonly { id: string; unlockLevel: number }[],
  shipped: readonly string[],
): { unlocked: string[]; held: string[] } {
  const reached = unlockedIds(level, locations);
  return { unlocked: reached.filter((id) => shipped.includes(id)), held: reached.filter((id) => !shipped.includes(id)) };
}

/** Where a user is within their current level: Knowledge into the level, needed for the next, and 0–100 percent. */
export function levelProgress(knowledge: number, thresholds: readonly number[] = LEVEL_THRESHOLDS): { into: number; span: number; percent: number; maxed: boolean } {
  const level = levelForKnowledge(knowledge, thresholds);
  const start = thresholds[level - 1] ?? 0;
  const next = thresholds[level];
  if (next === undefined) return { into: 0, span: 0, percent: 100, maxed: true };
  const into = Math.max(0, knowledge - start);
  const span = next - start;
  return { into, span, percent: Math.min(100, Math.round((into / span) * 100)), maxed: false };
}
