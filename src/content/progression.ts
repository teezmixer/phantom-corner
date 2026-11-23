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
  // L26–L29 carry on at the same pace so the bonus locations (D-31) can be reached; the spec's curve ends at L25.
  4610, 4900, 5190, 5480,
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

/**
 * Locations that exist for real. A location whose unlock level is reached but is not listed here is HELD: nothing unlocks
 * until it ships, and the level-up only hints that someone has been asking (spec §3.4 "when a user outruns the content").
 * All twelve have placeholder content today, so all are listed; ship a location by adding its id once its content is real.
 * DECISION: D-31.
 */
export const SHIPPED_LOCATIONS: readonly string[] = [
  "leblanc", "ryuji", "ann", "yusuke", "makoto", "futaba", "haru", "akechi",
  "rainy-walk", "subway", "velvet-room", "mementos",
];

/** Calendar stamp designs, oldest first. Index 0 is the default; each `stamp` reward below unlocks the next one. Icons: components/Calendar. */
export const STAMP_STYLES = ["stamp", "star", "heart", "moon", "lightning", "crown"] as const;
export type StampStyle = (typeof STAMP_STYLES)[number];

/**
 * What each level gives (spec §3.4: "no empty level-ups"). `unlock` levels bring a location (their notice is Ares's own line);
 * every other level gives something small: the map button, a new calendar stamp, a study tip or a remark. The wording of the
 * non-unlock rewards is in content/copy (`levelRewards`). PROVISIONAL (D-31).
 */
export type LevelReward = { kind: "map" } | { kind: "unlock" } | { kind: "stamp"; style: StampStyle } | { kind: "tip" } | { kind: "line" };

export const LEVEL_REWARDS: Record<number, LevelReward> = {
  2: { kind: "map" },
  3: { kind: "unlock" },
  4: { kind: "stamp", style: "star" },
  5: { kind: "unlock" },
  6: { kind: "tip" },
  7: { kind: "line" },
  8: { kind: "unlock" },
  9: { kind: "tip" },
  10: { kind: "stamp", style: "heart" },
  11: { kind: "line" },
  12: { kind: "unlock" },
  13: { kind: "tip" },
  14: { kind: "line" },
  15: { kind: "stamp", style: "moon" },
  16: { kind: "unlock" },
  17: { kind: "tip" },
  18: { kind: "line" },
  19: { kind: "stamp", style: "lightning" },
  20: { kind: "unlock" },
  21: { kind: "tip" },
  22: { kind: "line" },
  23: { kind: "stamp", style: "crown" },
  24: { kind: "tip" },
  25: { kind: "unlock" },
  26: { kind: "unlock" },
  27: { kind: "unlock" },
  28: { kind: "unlock" },
  29: { kind: "unlock" },
};
