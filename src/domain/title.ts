import { formatClock, remainingMs, type TimerState } from "./timer";

export const BASE_TITLE = "Phantom Corner";

/** The tab title: the countdown while a session runs or is paused, so it is visible from another tab. */
export function tabTitle(timer: TimerState, now: number): string {
  if (timer.status === "running") return `${formatClock(remainingMs(timer, now))} · ${BASE_TITLE}`;
  if (timer.status === "paused") return `Paused ${formatClock(remainingMs(timer, now))} · ${BASE_TITLE}`;
  return BASE_TITLE;
}
