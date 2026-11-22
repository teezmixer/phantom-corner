/**
 * PROVISIONAL — Knowledge (XP) rules, level curve and unlock levels (spec §3.4, decision D-06).
 * Every number here is the spec author's proposal, not Ares's decision. Change them here only.
 */
export const provisional = true;

export const KNOWLEDGE_RULES = {
  /** Knowledge per focused minute. */
  perFocusedMinute: 1,
  /** Bonus when a session reaches zero. */
  completionBonus: 5,
  /** A stopped session counts its minutes only if at least this long; no bonus. */
  cutShortMinimumMinutes: 5,
  /** Writing the first mission, once. */
  firstMission: 10,
} as const;

/**
 * Total Knowledge needed to REACH each level. Level 1 starts at 0.
 * L2 = 10 (first mission → map), L3 = 35 (first mission + first 25-minute session → Ryuji).
 */
export const LEVEL_THRESHOLDS: readonly number[] = [
  // Anchors: ~72 Knowledge per focused hour (60 + 5 per 25-minute session), so
  // L5 ≈ 3 h, L8 ≈ 8 h, L12 ≈ 15 h, L16 ≈ 25 h, L20 ≈ 40 h, L25 ≈ 60 h; levels between are interpolated.
  0, 10, 35, 125, 215, // L1–L5
  335, 455, 575, 700, 830, 955, 1080, // L6–L12
  1260, 1440, 1620, 1800, 2070, 2340, 2610, 2880, // L13–L20
  3170, 3455, 3745, 4030, 4320, // L21–L25
];

/** Level at which each canon location unlocks. LeBlanc is open from the start. */
export const UNLOCK_LEVELS: Record<string, number> = {
  leblanc: 1,
  ryuji: 3,
  ann: 5,
  yusuke: 8,
  makoto: 12,
  futaba: 16,
  haru: 20,
  akechi: 25,
};

/** Level at which the map button appears (spec §3.4 DECIDED: first Knowledge → level 2 → map). */
export const MAP_UNLOCK_LEVEL = 2;

/**
 * PROVISIONAL bonus-location rule (decision D-08): the spec leaves this to a community vote.
 * Placeholder: one bonus location per level after the last canon unlock, in this order.
 */
export const BONUS_UNLOCK_LEVELS: Record<string, number> = {
  "rainy-walk": 26,
  subway: 27,
  "velvet-room": 28,
  mementos: 29,
};
