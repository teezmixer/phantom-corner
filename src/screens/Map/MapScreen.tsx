import { Lock, MapPin, MapPinSimpleArea } from "@phosphor-icons/react";
import { ui } from "@/content/copy";
import { LOCATIONS } from "@/content/registry";
import { useStore } from "@/state/StoreProvider";
import { Overlay, buttonClass } from "../Overlay";

/**
 * Map of every location: locked, unlocked and current. A plain list-of-markers wireframe (layout is Ares's call,
 * DECISION: map-layout). Locked places show only their order and level — no progress bar toward unlocks (spec §3.4).
 */
export function MapScreen() {
  const { state, derived, dispatch } = useStore();
  return (
    <Overlay title="Map">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LOCATIONS.map((loc, index) => {
          const unlocked = derived.unlocked.includes(loc.id);
          const current = state.locationId === loc.id;
          const Icon = current ? MapPinSimpleArea : unlocked ? MapPin : Lock;
          return (
            <li key={loc.id}>
              <button
                type="button"
                disabled={!unlocked}
                aria-disabled={current || undefined}
                aria-current={current ? "location" : undefined}
                onClick={() => { if (!current) dispatch({ type: "START_TRAVEL", to: loc.id }); }}
                className={`${buttonClass} flex w-full items-center gap-3 ${current ? "bg-redbright" : ""}`}
                data-state={current ? "current" : unlocked ? "unlocked" : "locked"}
              >
                <Icon size={24} weight={unlocked ? "fill" : "regular"} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-lg ${unlocked ? "font-display-hero" : "font-body-primary"}`}>{unlocked ? loc.name : ui.lockedPlace(index + 1)}</span>
                  <span className={`block text-xs ${current ? "text-white" : "text-greylight"}`}>
                    {current ? ui.youAreHere : unlocked ? loc.register : ui.lockedAt(loc.unlockLevel)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Overlay>
  );
}
