/**
 * The calendar of studied days (spec §3.4): a month grid with a stamp on each day you studied. No counter and no
 * streak, ever. Pure: no React, no storage; dates come from an injected time.
 */
import { KNOWLEDGE_RULES, LEVEL_REWARDS, STAMP_STYLES } from "@/content/progression";
import { knowledgeFor, levelForKnowledge, type ProgressEvent } from "./progress";

/** One stamped day: the local date it belongs to and the stamp design that was current when it was stamped. */
export interface StampedDay {
  /** Local date, `YYYY-MM-DD`. */
  day: string;
  /** Index into STAMP_STYLES. */
  style: number;
}

/** At most this many days are kept (ten years): more is a corrupt list, not a person. */
export const MAX_STAMPED_DAYS = 3660;
export const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** The local calendar day of a moment, e.g. "2026-11-23". Local, because "today" is the user's day, not UTC's. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Does this event count as having studied? A finished session, or a cut-short one that earned Knowledge (spec §3.4). */
export function isStudied(event: ProgressEvent): boolean {
  if (event.kind !== "session") return false;
  if (event.outcome === "completed") return true;
  return Math.floor(event.focusedMs / 60_000) >= KNOWLEDGE_RULES.cutShortMinimumMinutes;
}

/** Stamp a day. A day already stamped keeps its first stamp (so history does not change). Returns the same array when nothing changes. */
export function stampDay(days: readonly StampedDay[], ms: number, style: number): readonly StampedDay[] {
  const day = dayKey(ms);
  if (days.some((d) => d.day === day)) return days;
  const next = [...days, { day, style }];
  return next.length > MAX_STAMPED_DAYS ? next.slice(next.length - MAX_STAMPED_DAYS) : next;
}

/** The newest stamp design a player at this level has earned (an index into STAMP_STYLES). */
export function stampStyleFor(level: number): number {
  const unlocked = Object.entries(LEVEL_REWARDS).filter(([lvl, r]) => Number(lvl) <= level && r.kind === "stamp").map(([, r]) => (r.kind === "stamp" ? STAMP_STYLES.indexOf(r.style) : 0));
  return Math.max(0, ...unlocked);
}

/**
 * A month as weeks, Monday first. Each cell is the day of the month, or null for the padding before the 1st and after the
 * last day. `month` is 0–11.
 */
export function monthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/** Month and year the grid is for, moved by `delta` months (negative = earlier). */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + month + delta;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

/**
 * Add an event to the log and, when it counts as having studied, stamp the day it happened on with the design the player has
 * earned by then. The ONE place a session is recorded, so the reducer and the "ended while the tab was closed" path stamp
 * days identically. `atMs` is when the session really ended (for a finished one: its end time, not when the tab noticed).
 */
export function recordSession(events: readonly ProgressEvent[], days: readonly StampedDay[], event: ProgressEvent, atMs: number): { events: ProgressEvent[]; studiedDays: readonly StampedDay[] } {
  const next = [...events, event];
  if (!isStudied(event)) return { events: next, studiedDays: days };
  return { events: next, studiedDays: stampDay(days, atMs, stampStyleFor(levelForKnowledge(knowledgeFor(next)))) };
}

/** Keep the stamps that are well formed (a real date, a known design) and drop the rest, so one bad entry never costs the list. */
export function repairStampedDays(raw: unknown): StampedDay[] {
  if (!Array.isArray(raw)) return [];
  const out: StampedDay[] = [];
  const seen = new Set<string>();
  for (const item of raw.slice(-MAX_STAMPED_DAYS)) {
    if (typeof item !== "object" || item === null) continue;
    const { day, style } = item as Record<string, unknown>;
    if (typeof day !== "string" || !DAY_KEY.test(day) || seen.has(day)) continue;
    const [y, m, d] = day.split("-").map(Number) as [number, number, number];
    const real = new Date(y, m - 1, d);
    if (real.getFullYear() !== y || real.getMonth() !== m - 1 || real.getDate() !== d) continue; // 2026-02-31 is not a day
    out.push({ day, style: typeof style === "number" && Number.isInteger(style) && style >= 0 && style < STAMP_STYLES.length ? style : 0 });
    seen.add(day);
  }
  return out;
}
