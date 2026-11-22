/**
 * Countdown to a mission deadline. Pure: `now` is injected. Whole minutes; no seconds, because a deadline is a
 * planning aid, not a stopwatch. (Wording is a draft — decision D-10.)
 */
export interface Countdown {
  /** Short text for the widget, e.g. "due in 2 h 15 min" or "overdue by 1 day". */
  text: string;
  overdue: boolean;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function span(ms: number): string {
  if (ms >= DAY) { const d = Math.floor(ms / DAY); return `${d} day${d === 1 ? "" : "s"}`; }
  if (ms >= HOUR) {
    // Minutes round UP, like the timer: 2 h 14 min 59 s left reads "2 h 15 min", never "2 h 14 min".
    const total = Math.ceil(ms / MIN);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }
  const m = Math.max(1, Math.ceil(ms / MIN));
  return `${m} min`;
}

export function countdown(deadlineIso: string, now: number): Countdown | null {
  const due = Date.parse(deadlineIso);
  if (Number.isNaN(due)) return null;
  const diff = due - now;
  if (diff > 0) return { text: `due in ${span(diff)}`, overdue: false };
  return { text: diff > -MIN ? "due now" : `overdue by ${span(-diff)}`, overdue: true };
}

/** A `datetime-local` value ("2026-11-22T18:30", local time) → ISO, or null when empty or invalid. */
export function deadlineFromInput(value: string): string | null {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** ISO → the value a `datetime-local` input expects (local time, minutes). */
export function inputFromDeadline(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
