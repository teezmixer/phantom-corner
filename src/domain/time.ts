/** Time-of-day label for the date widget (spec §3.6: a label only, no weather). */
export type DayPart = "Morning" | "Daytime" | "Evening" | "Night";

export function dayPart(date: Date): DayPart {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "Morning";
  if (h >= 11 && h < 17) return "Daytime";
  if (h >= 17 && h < 21) return "Evening";
  return "Night";
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
