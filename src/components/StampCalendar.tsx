import { useState } from "react";
import { CaretLeft, CaretRight, Crown, Heart, Lightning, Moon, Star, Stamp, type Icon } from "@phosphor-icons/react";
import { ui } from "@/content/copy";
import { STAMP_STYLES } from "@/content/progression";
import { dayKey, monthGrid, shiftMonth, type StampedDay } from "@/domain/calendar";
import { cn } from "@/lib/utils";

/** One Phosphor icon per stamp design, in the same order as STAMP_STYLES (content/progression.ts). */
const STAMP_ICONS: Record<(typeof STAMP_STYLES)[number], Icon> = { stamp: Stamp, star: Star, heart: Heart, moon: Moon, lightning: Lightning, crown: Crown };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A month grid with a stamp on each day you studied (spec §3.4). No counter, no streak, no "broken" state: a day without a
 * stamp is simply a day without a stamp. Monday first. Shows the month of `now` and can move to other months.
 * DECISION: D-31 — the grid's look and the stamp icons are placeholders until Ares draws the calendar.
 */
export function StampCalendar({ days, now }: { days: readonly StampedDay[]; now: number }) {
  const today = new Date(now);
  const [shown, setShown] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const stamps = new Map(days.map((d) => [d.day, d.style]));
  const todayKey = dayKey(now);
  const title = new Date(shown.year, shown.month, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  const weeks = monthGrid(shown.year, shown.month);
  const step = (delta: number) => setShown((s) => shiftMonth(s.year, s.month, delta));

  return (
    <section aria-label={ui.calendar.label} className="border border-white p-3">
      <header className="mb-2 flex items-center justify-between">
        <button type="button" aria-label={ui.calendar.previous} onClick={() => step(-1)} className="p-1 hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal"><CaretLeft size={18} aria-hidden="true" /></button>
        <h3 className="font-display-label text-lg">{title}</h3>
        <button type="button" aria-label={ui.calendar.next} onClick={() => step(1)} className="p-1 hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal"><CaretRight size={18} aria-hidden="true" /></button>
      </header>
      <table className="w-full table-fixed border-collapse text-center text-xs">
        <thead>
          <tr>{ui.calendar.weekdays.map((d) => <th key={d} scope="col" className="pb-1 font-normal text-greylight">{d}</th>)}</tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day, i) => {
                if (day === null) return <td key={i} />;
                const key = `${shown.year}-${pad(shown.month + 1)}-${pad(day)}`;
                const style = stamps.get(key);
                const StampIcon = style === undefined ? null : STAMP_ICONS[STAMP_STYLES[style] ?? STAMP_STYLES[0]];
                return (
                  <td key={i} aria-current={key === todayKey ? "date" : undefined} data-day={key} data-stamp={style === undefined ? undefined : STAMP_STYLES[style] ?? STAMP_STYLES[0]}
                    className={cn("h-7 border border-greydark align-middle", key === todayKey && "border-2 border-white", StampIcon ? "bg-redbright text-white" : "text-greylight")}>
                    {StampIcon ? <StampIcon size={18} weight="fill" className="mx-auto" aria-hidden="true" /> : day}
                    {StampIcon && <span className="sr-only">{day}, {ui.calendar.studied}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
