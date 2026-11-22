/**
 * Progress maths. Pure functions only — no React, no storage (spec §4.3 domain/).
 * Numbers come from content/progression.ts (provisional), never hard-coded here.
 */
import { LEVEL_THRESHOLDS } from "@/content/progression";

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
