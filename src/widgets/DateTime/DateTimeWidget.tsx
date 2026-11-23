import { CalendarBlank, MoonStars, Sun, SunHorizon } from "@phosphor-icons/react";
import { RollingNumber } from "@/components/ui/rolling-number";
import { useNow } from "@/hooks/useNow";
import { dayPart, WEEKDAYS, type DayPart } from "@/domain/time";
import { Slab } from "../Slab";

const DAY_ICON: Record<DayPart, typeof Sun> = { Morning: SunHorizon, Daytime: Sun, Evening: SunHorizon, Night: MoonStars };
const pad = (n: number) => String(n).padStart(2, "0");
const pad2 = (n: number) => pad(n);

/** Month/day, weekday, live clock and a time-of-day label — no weather (spec §3.6). Digits roll via Cult UI. */
export function DateTimeWidget() {
  const date = new Date(useNow(1000));
  const part = dayPart(date);
  const Icon = DAY_ICON[part];
  return (
    <Slab className="flex h-full w-full flex-col justify-between p-2" label="Date and time">
      <div className="flex items-center gap-2 font-display-hero text-6xl leading-none">
        <CalendarBlank size={36} aria-hidden="true" />
        <span aria-label={`${date.getMonth() + 1}/${date.getDate()}`}>
          <RollingNumber value={date.getMonth() + 1} />/<RollingNumber value={date.getDate()} />
        </span>
      </div>
      <div className="flex items-baseline justify-between text-base">
        <span className="border-b-2 border-redbright font-body-primary uppercase tracking-wide text-white">{WEEKDAYS[date.getDay()]}</span>
        <span className="flex items-center gap-1"><Icon size={16} aria-hidden="true" />{part}</span>
        <time className="tabular-nums" dateTime={`${pad(date.getHours())}:${pad(date.getMinutes())}`}>
          <RollingNumber value={date.getHours()} format={pad2} />:<RollingNumber value={date.getMinutes()} format={pad2} />
        </time>
      </div>
    </Slab>
  );
}
