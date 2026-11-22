import { useEffect, useState } from "react";
import { ui } from "@/content/copy";
import { useStore } from "@/state/StoreProvider";
import { Overlay, buttonClass } from "../Overlay";

/**
 * Settings wireframe. Working now: Hide UI, sound, reset, links to About / Credits / Privacy. The art slot, widget
 * toggles, per-bus volumes, HUD size, motion, menu style, analytics, export and delete arrive in M5.
 */
export function SettingsScreen() {
  const { state, dispatch } = useStore();
  // Two presses to erase: the first arms the button for a few seconds. (Whether to confirm at all: decision D-22.)
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <Overlay title="Settings">
      <div className="flex flex-col gap-2">
        <button type="button" aria-pressed={state.hudHidden} onClick={() => { dispatch({ type: "TOGGLE_HUD" }); dispatch({ type: "SET_LAYER", layer: "main" }); }} className={buttonClass}>{ui.hideUi}</button>
        <button type="button" aria-pressed={state.muted} onClick={() => dispatch({ type: "TOGGLE_MUTE" })} className={buttonClass}>Sound: {state.muted ? "off" : "on"}</button>
        <button type="button" onClick={() => dispatch({ type: "SET_LAYER", layer: "about" })} className={buttonClass}>About</button>
        <button type="button" onClick={() => dispatch({ type: "SET_LAYER", layer: "credits" })} className={buttonClass}>Credits</button>
        <button type="button" onClick={() => dispatch({ type: "SET_LAYER", layer: "privacy" })} className={buttonClass}>Privacy</button>
        <button type="button" onClick={() => (armed ? dispatch({ type: "RESET" }) : setArmed(true))} className={`${buttonClass} ${armed ? "bg-redbright" : ""}`}>{armed ? ui.resetConfirm : ui.resetAll}</button>
      </div>
      <p className="text-sm text-greylight">{ui.settingsNotYet}</p>
    </Overlay>
  );
}
