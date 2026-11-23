/**
 * Day or night for the room (spec §3.3: each place has a day and a night variant, chosen from the player's own clock).
 * Pure. The hours are PROVISIONAL (D-36): day from 06:00 up to 19:00 local time, night the rest.
 */
export type DayPart = "day" | "night";

export const DAY_STARTS_HOUR = 6;
export const NIGHT_STARTS_HOUR = 19;

export function dayPartAt(ms: number): DayPart {
  const hour = new Date(ms).getHours();
  return hour >= DAY_STARTS_HOUR && hour < NIGHT_STARTS_HOUR ? "day" : "night";
}
