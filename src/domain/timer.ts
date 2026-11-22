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

export const initialTimer: TimerState = { status: "idle", durationMs: DEFAULT_DURATION_MS };

/** Unknown state/event combinations return the same state object. */
export function transition(state: TimerState, event: TimerEvent): TimerState {
  switch (state.status) {
    case "idle":
      if (event.type === "SET_DURATION") return { status: "idle", durationMs: event.durationMs };
      if (event.type === "START") return { status: "running", durationMs: state.durationMs, endsAt: event.now + state.durationMs };
      return state;
    case "running":
      if (event.type === "PAUSE") return { status: "paused", durationMs: state.durationMs, remainingMs: Math.max(0, state.endsAt - event.now) };
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

/** Milliseconds left, derived from the state and the injected current time. */
export function remainingMs(state: TimerState, now: number): number {
  switch (state.status) {
    case "idle":
      return state.durationMs;
    case "running":
      return Math.max(0, state.endsAt - now);
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
