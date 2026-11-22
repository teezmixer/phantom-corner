import { Student } from "@phosphor-icons/react";
import { LOCATIONS } from "@/content/registry";
import { useStore } from "@/state/StoreProvider";
import { Overlay } from "../Overlay";

/** Profile wireframe: portrait slot, totals and roster. The calendar and member-since arrive in M12. */
export function ProfileScreen() {
  const { state, derived } = useStore();
  const stat = (label: string, value: string | number) => (
    <div className="border border-white p-2"><dt className="text-xs text-greylight">{label}</dt><dd className="font-display-hero text-3xl leading-none">{value}</dd></div>
  );
  return (
    <Overlay title="Profile">
      <div className="flex items-center gap-4">
        <div className="grid size-24 shrink-0 place-items-center border-2 border-dashed border-greymid text-greymid" role="img" aria-label="Portrait art slot"><Student size={48} /></div>
        <p className="font-display-title text-3xl">{state.name || "Student Ren"}</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stat("Knowledge", derived.knowledge)}
        {stat("Level", derived.level)}
        {stat("Sessions", derived.sessions)}
        {stat("Minutes focused", derived.minutesFocused)}
      </dl>
      <section aria-label="Roster">
        <h3 className="mb-1 text-sm text-greylight">Roster</h3>
        <ul className="flex flex-wrap gap-2 text-sm">
          {LOCATIONS.filter((l) => derived.unlocked.includes(l.id)).map((l) => (
            <li key={l.id} className="border border-white px-2 py-1">{l.character ? `${l.character} — ` : ""}{l.name}</li>
          ))}
        </ul>
      </section>
    </Overlay>
  );
}
