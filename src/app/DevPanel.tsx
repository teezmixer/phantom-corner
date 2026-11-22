import { useState } from "react";
import { Wrench } from "@phosphor-icons/react";
import { LOCATIONS } from "@/content/registry";
import { THREADS } from "@/content/threads";
import { useStore } from "@/state/StoreProvider";
import type { Layer } from "@/state/store";

const SCREENS: Layer[] = ["splash", "main", "menu", "map", "settings", "profile", "summary", "choice", "break", "about", "credits", "privacy"];

const field = "border border-white bg-black px-1 text-xs";
const btn = "border border-white bg-black px-2 py-1 text-xs hover:bg-redbright focus-visible:outline-2 focus-visible:outline-accentteal";

/**
 * Dev tools, only with ?dev=true: reach everything without grinding. Off by default and invisible to users.
 * Grant Knowledge, unlock everything, jump to any location / screen / thread, reset all data.
 */
export function DevPanel() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(true);
  return (
    <aside aria-label="Developer tools" className="fixed left-1/2 top-2 z-[60] -translate-x-1/2 border-2 border-accentteal bg-black p-2 font-body-primary text-white">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-1 text-xs text-accentteal"><Wrench size={14} />DEV — nothing here is saved</button>
      {open && (
        <div className="mt-2 flex max-w-[90vw] flex-wrap items-center gap-2">
          <button type="button" className={btn} onClick={() => dispatch({ type: "DEV_GRANT", knowledge: 50 })}>+50 Knowledge</button>
          <button type="button" className={btn} onClick={() => dispatch({ type: "DEV_UNLOCK_ALL" })}>Unlock all</button>
          <label className="flex items-center gap-1 text-xs">Location
            <select aria-label="Jump to location" className={field} value={state.locationId} onChange={(e) => dispatch({ type: "DEV_JUMP_LOCATION", id: e.target.value })}>
              {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1 text-xs">Screen
            <select aria-label="Jump to screen" className={field} value="" onChange={(e) => e.target.value && dispatch({ type: "SET_LAYER", layer: e.target.value as Layer })}>
              <option value="">jump…</option>
              {SCREENS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <button type="button" className={btn} onClick={() => dispatch({ type: "SET_PHONE", open: true })}>Open phone</button>
          <button type="button" className={btn} onClick={() => dispatch({ type: "MARK_ALL_UNREAD", ids: THREADS.map((t) => t.id) })}>All threads unread</button>
          <button type="button" className={btn} onClick={() => dispatch({ type: "RESET" })}>Reset all data</button>
        </div>
      )}
    </aside>
  );
}
