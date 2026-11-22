import { useState } from "react";
import { Mixer } from "@/app/Mixer";
import { settings as copy, ui } from "@/content/copy";
import { HUD_SIZES, TOGGLEABLE_WIDGETS, type WidgetId } from "@/hud/slots";
import { buildExport } from "@/state/persistence/exportData";
import { STORAGE_KEY } from "@/state/persistence/schema";
import { useStore } from "@/state/StoreProvider";
import { Overlay, buttonClass } from "../Overlay";

const group = "flex flex-col gap-2 border border-white p-3";
// White text with a red accent bar: small red-on-black text is only 4.1:1 (spec §4.12 allows red for large text only).
const legend = "border-l-4 border-redbright px-2 font-body-primary text-sm uppercase tracking-wide text-white";
const row = "flex items-center gap-2 text-sm";

function readStored(): string | null {
  try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

/**
 * Settings: widget toggles, sound, HUD size, motion, menu style, analytics, account, export and delete (spec §3.2).
 * Everything here is saved with the rest of the preferences. The art slot is a placeholder for the drawn Ren (Ares).
 */
export function SettingsScreen() {
  const { state, dispatch, persistent, wipe } = useStore();
  // Two presses to delete: the first arms the button, and it disarms when focus leaves it — no timer to race against
  // (WCAG 2.2.1). ("Are you sure?" is a banned phrase.)
  const [armed, setArmed] = useState(false);
  const [exported, setExported] = useState(false);

  const exportData = () => {
    // Demo and dev visits export their own state, never mixed with the real saved identity.
    const { filename, json } = buildExport(state, persistent ? readStored() : null, new Date().toISOString());
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };

  const erase = () => {
    if (!armed) { setArmed(true); return; }
    // Real progress: wipe storage, cancel pending saves and reload to a true first visit. A demo or dev visit has no saved
    // progress of its own, so it only resets itself and never touches the real save.
    if (persistent) wipe();
    else dispatch({ type: "RESET" });
  };

  return (
    <Overlay title={copy.title} className="max-w-3xl">
      <div className="flex items-center gap-3 border border-dashed border-greymid p-3 text-sm text-greylight" role="img" aria-label={copy.artSlot}>{copy.artSlot}</div>

      <fieldset className={group}>
        <legend className={legend}>{copy.widgets}</legend>
        {TOGGLEABLE_WIDGETS.map((id: WidgetId) => (
          <label key={id} className={row}>
            <input type="checkbox" className="size-4 accent-primary" checked={!state.hiddenWidgets.includes(id)} onChange={() => dispatch({ type: "TOGGLE_WIDGET", id })} />
            {copy.widgetNames[id as keyof typeof copy.widgetNames]}
          </label>
        ))}
        <button type="button" aria-pressed={state.hudHidden} onClick={() => { dispatch({ type: "TOGGLE_HUD" }); dispatch({ type: "SET_LAYER", layer: "main" }); }} className={`${buttonClass} text-sm`}>{ui.hideUi}</button>
        <p className="text-xs text-greylight">{copy.widgetsNote}</p>
      </fieldset>

      <fieldset className={group}>
        <legend className={legend}>{copy.volumes}</legend>
        <Mixer className="flex flex-col gap-1 font-body-primary text-white" />
      </fieldset>

      <fieldset className={group}>
        <legend className={legend}>{copy.hudSize}</legend>
        <div className="flex flex-wrap gap-4">
          {HUD_SIZES.map((size) => (
            <label key={size} className={row}>
              <input type="radio" name="hud-size" className="size-4 accent-primary" checked={state.hudSize === size} onChange={() => dispatch({ type: "SET_HUD_SIZE", size })} />
              {copy.hudSizes[size]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={group}>
        <legend className={legend}>{copy.motion}</legend>
        <div className="flex flex-wrap gap-4">
          {(["system", "reduced"] as const).map((m) => (
            <label key={m} className={row}>
              <input type="radio" name="motion" className="size-4 accent-primary" checked={state.motion === m} onChange={() => dispatch({ type: "SET_MOTION", motion: m })} />
              {copy.motionOptions[m]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={group}>
        <legend className={legend}>{copy.menuStyle}</legend>
        <label className={row}>
          <input type="radio" name="menu-style" className="size-4 accent-primary" checked readOnly />
          {copy.menuStyleNow}
        </label>
        <p className="text-xs text-greylight">{copy.menuStyleLater}</p>
      </fieldset>

      <fieldset className={group}>
        <legend className={legend}>{copy.analytics}</legend>
        <label className={row}>
          <input type="checkbox" className="size-4 accent-primary" checked={state.analytics} onChange={(e) => dispatch({ type: "SET_ANALYTICS", on: e.target.checked })} />
          {copy.analytics}
        </label>
        <p className="text-xs text-greylight">{copy.analyticsNote}</p>
      </fieldset>

      <fieldset className={group}>
        <legend className={legend}>{copy.account}</legend>
        <p className="text-sm">{copy.accountNote}</p>
      </fieldset>

      <fieldset className={group}>
        <legend className={legend}>{copy.data}</legend>
        <button type="button" onClick={exportData} className={`${buttonClass} text-sm`}>{copy.export}</button>
        {exported && <p role="status" className="text-xs text-greylight">{copy.exported}</p>}
        <button type="button" onClick={erase} onBlur={() => setArmed(false)} className={`${buttonClass} text-sm ${armed ? "bg-redbright" : ""}`}>{armed ? copy.eraseConfirm : copy.erase}</button>
        <p role="status" className="sr-only">{armed ? copy.eraseConfirm : ""}</p>
      </fieldset>

      <fieldset className={group}>
        <legend className={legend}>{copy.info}</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => dispatch({ type: "SET_LAYER", layer: "about" })} className={`${buttonClass} text-sm`}>{copy.infoButtons.about}</button>
          <button type="button" onClick={() => dispatch({ type: "SET_LAYER", layer: "credits" })} className={`${buttonClass} text-sm`}>{copy.infoButtons.credits}</button>
          <button type="button" onClick={() => dispatch({ type: "SET_LAYER", layer: "privacy" })} className={`${buttonClass} text-sm`}>{copy.infoButtons.privacy}</button>
        </div>
      </fieldset>
    </Overlay>
  );
}
