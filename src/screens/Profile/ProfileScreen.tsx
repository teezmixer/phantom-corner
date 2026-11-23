import { useState } from "react";
import { Student } from "@phosphor-icons/react";
import { ui } from "@/content/copy";
import { LOCATIONS } from "@/content/registry";
import { StampCalendar } from "@/components/StampCalendar";
import { useStore } from "@/state/StoreProvider";
import { Overlay } from "../Overlay";

/** A date as the player reads it: "23 Nov 2026", in their own language and calendar. */
const formatDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/**
 * Profile (spec §3.2): a portrait slot (the drawing is Ares's, D-21), the name, the totals, how long they have been here, the
 * calendar of days studied and the roster of places and people unlocked. Wireframe look (placeholder-screen-look).
 */
export function ProfileScreen() {
  const { state, derived } = useStore();
  const [now] = useState(() => Date.now()); // read once when the screen opens
  const t = ui.profile;
  const stat = (label: string, value: string | number) => (
    <div className="border border-white p-2"><dt className="text-xs text-greylight">{label}</dt><dd className="font-display-hero text-3xl leading-none">{value}</dd></div>
  );
  const open = LOCATIONS.filter((l) => derived.unlocked.includes(l.id));
  return (
    <Overlay title={t.title}>
      <div className="flex items-center gap-4">
        <div className="grid size-24 shrink-0 place-items-center border-2 border-dashed border-greymid text-greymid" role="img" aria-label={t.portrait}><Student size={48} /></div>
        <div>
          <p className="font-display-hero text-3xl">{state.name || ui.defaultName}</p>
          {state.memberSince && <p className="text-sm text-greylight">{t.memberSince} <time dateTime={state.memberSince}>{formatDay(state.memberSince)}</time></p>}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stat(t.knowledge, derived.knowledge)}
        {stat(t.level, derived.level)}
        {stat(t.sessions, derived.sessions)}
        {stat(t.minutes, derived.minutesFocused)}
      </dl>
      <section aria-label={t.roster}>
        <h3 className="mb-1 text-sm text-greylight">{t.roster}</h3>
        <ul className="flex flex-wrap gap-2 text-sm">
          {open.length === 0 && <li className="text-greylight">{t.rosterEmpty}</li>}
          {open.map((l) => (
            <li key={l.id} className="border border-white px-2 py-1">{l.character ? `${l.character} — ` : ""}{l.name}</li>
          ))}
        </ul>
      </section>
      <StampCalendar days={state.studiedDays} now={now} />
    </Overlay>
  );
}
