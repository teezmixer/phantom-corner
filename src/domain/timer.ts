/**
 * Timer state machine (spec §4.5). Pure: time is injected through events, never read from a clock.
 * Remaining time is derived from `endsAt`, never decremented, so background tabs cannot drift.
 */
export type TimerState =
  | { status: "idle"; durationMs: number }
  | { status: "running"; durationMs: number; endsAt: number }
  | { status: "paused"; durationMs: number; remainingMs: number }
  | { status: "complete"; durationMs: number };

export type TimerEvent =
  | { type: "SET_DURATION"; durationMs: number }
  | { type: "START"; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "RESUME"; now: number }
  | { type: "STOP" }
  | { type: "TICK"; now: number }
  | { type: "ACKNOWLEDGE" };

export const MINUTE = 60_000;
export const DEFAULT_DURATION_MS = 25 * MINUTE;
/** Custom session length bounds in minutes. PROVISIONAL: the spec author's range (§3.6), not Ares's decision. */
export const MIN_CUSTOM_MINUTES = 5;
export const MAX_CUSTOM_MINUTES = 120;

/** A typed-in length in minutes → a whole number of minutes inside the allowed range. Junk becomes the default. */
export function clampCustomMinutes(input: number): number {
  if (!Number.isFinite(input)) return DEFAULT_DURATION_MS / MINUTE;
  return Math.min(MAX_CUSTOM_MINUTES, Math.max(MIN_CUSTOM_MINUTES, Math.round(input)));
}

export const initialTimer: TimerState = { status: "idle", durationMs: DEFAULT_DURATION_MS };

/** A duration in ms forced into the allowed range (SET_DURATION can never store a negative, zero or huge length). */
export function clampDurationMs(ms: number): number {
  return clampCustomMinutes(ms / MINUTE) * MINUTE;
}

/** Unknown state/event combinations return the same state object. */
export function transition(state: TimerState, event: TimerEvent): TimerState {
  switch (state.status) {
    case "idle":
      if (event.type === "SET_DURATION") return { status: "idle", durationMs: clampDurationMs(event.durationMs) };
      if (event.type === "START") return { status: "running", durationMs: state.durationMs, endsAt: event.now + state.durationMs };
      return state;
    case "running":
      if (event.type === "PAUSE") return { status: "paused", durationMs: state.durationMs, remainingMs: clampRemaining(state.endsAt - event.now, state.durationMs) };
      if (event.type === "STOP") return { status: "idle", durationMs: state.durationMs };
      if (event.type === "TICK" && event.now >= state.endsAt) return { status: "complete", durationMs: state.durationMs };
      return state;
    case "paused":
      if (event.type === "RESUME") return { status: "running", durationMs: state.durationMs, endsAt: event.now + state.remainingMs };
      if (event.type === "STOP") return { status: "idle", durationMs: state.durationMs };
      return state;
    case "complete":
      if (event.type === "ACKNOWLEDGE") return { status: "idle", durationMs: state.durationMs };
      return state;
  }
}

/**
 * Remaining time is always within [0, durationMs]. Moving the system clock BACK would otherwise show more time than
 * the session has, and make a stopped session record negative focus. (Moving it FORWARD ends the session early: that is
 * inherent to a wall-clock design — see ADR 0005.)
 */
function clampRemaining(ms: number, durationMs: number): number {
  return Math.min(durationMs, Math.max(0, ms));
}

/** Milliseconds left, derived from the state and the injected current time. */
export function remainingMs(state: TimerState, now: number): number {
  switch (state.status) {
    case "idle":
      return state.durationMs;
    case "running":
      return clampRemaining(state.endsAt - now, state.durationMs);
    case "paused":
      return state.remainingMs;
    case "complete":
      return 0;
  }
}

/** "mm:ss" for a millisecond count, rounding partial seconds up so 00:00 only shows at zero. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * What a screen reader is told about the timer, politely (spec §4.12: role=timer, polite announcements). The visible
 * clock changes every second and must not be read out each time, so the sentence only changes at the start, every
 * five minutes, in the last minute, and on pause: the string is the same between those moments, and a live region
 * only speaks when its text changes.
 */
export function timerAnnouncement(timer: TimerState, now: number): string {
  if (timer.status === "paused") return "Paused";
  if (timer.status !== "running") return "";
  const left = remainingMs(timer, now);
  if (left <= 0) return "";
  if (left < MINUTE) return "Less than a minute left";
  const minutes = Math.ceil(left / MINUTE);
  return `${Math.ceil(minutes / 5) * 5} minutes left`;
}
