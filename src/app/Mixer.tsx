import { ui } from "@/content/copy";
import { getLocation } from "@/content/registry";
import { useStore } from "@/state/StoreProvider";
import type { Volumes } from "@/state/persistence/schema";

const BUSES: (keyof Volumes)[] = ["music", "ambience", "ui"];

/**
 * Volume per sound bus plus a level for each ambience layer of the current location (spec §3.6 "ambience mixer").
 * Music is the YouTube player's own volume; the other two are Web Audio buses. Everything is saved with the rest of the settings.
 */
export function Mixer() {
  const { state, dispatch } = useStore();
  const layers = getLocation(state.locationId).ambience;
  const row = "flex items-center justify-between gap-2 text-xs";
  return (
    <div role="group" aria-label={ui.mixer} className="pointer-events-auto flex max-h-[200px] w-64 flex-col gap-1 overflow-y-auto border-2 border-white bg-black p-2 font-body-primary text-white">
      <button type="button" aria-pressed={state.muted} onClick={() => dispatch({ type: "TOGGLE_MUTE" })} className="border border-white px-2 py-0.5 text-left text-xs hover:bg-redbright focus-visible:outline-2 focus-visible:outline-accentteal">
        {state.muted ? ui.soundOff : ui.soundOn}
      </button>
      {BUSES.map((bus) => (
        <label key={bus} className={row}>
          <span>{ui.mixerBuses[bus]}</span>
          <input type="range" min={0} max={100} value={Math.round(state.volumes[bus] * 100)} aria-label={`${ui.mixerBuses[bus]} volume`} onChange={(e) => dispatch({ type: "SET_VOLUME", bus, value: Number(e.target.value) / 100 })} className="w-28 accent-redbright" />
        </label>
      ))}
      {layers.length > 0 && <p className="mt-1 text-[10px] uppercase text-greylight">{ui.mixerBuses.ambience}</p>}
      {layers.map((layer) => (
        <label key={layer.id} className={row}>
          <span className="truncate">{layer.label}</span>
          <input type="range" min={0} max={100} value={Math.round((state.ambienceMix[layer.id] ?? 1) * 100)} aria-label={`${layer.label} level`} onChange={(e) => dispatch({ type: "SET_LAYER_VOLUME", id: layer.id, value: Number(e.target.value) / 100 })} className="w-28 accent-redbright" />
        </label>
      ))}
    </div>
  );
}
