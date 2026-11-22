import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getLocation } from "@/content/registry";
import { useStore } from "@/state/StoreProvider";
import { AudioEngine } from "./engine";
import { sfxFor } from "./triggers";

interface AudioApi {
  /** Create/resume the AudioContext. Call from a user gesture (the splash click does). */
  unlock(): void;
}

const AudioApiContext = createContext<AudioApi>({ unlock: () => undefined });

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider
export const useAudio = (): AudioApi => useContext(AudioApiContext);

/**
 * Connects the store to the audio engine: unlock on the first gesture, mute and volumes, the current location's
 * ambience, and interface sounds from state changes. `engine` can be injected for tests.
 */
export function AudioProvider({ children, engine: injected }: { children: ReactNode; engine?: AudioEngine }) {
  const { state } = useStore();
  const [engine] = useState(() => injected ?? new AudioEngine());
  const [unlocked, setUnlocked] = useState(false);

  const unlock = useCallback(() => {
    engine.unlock();
    setUnlocked(engine.unlocked);
  }, [engine]);

  // Any first gesture unlocks audio (the splash button does it explicitly; demo and dev modes skip the splash).
  useEffect(() => {
    const events = ["pointerdown", "keydown"] as const;
    const once = () => { unlock(); events.forEach((e) => window.removeEventListener(e, once, true)); };
    events.forEach((e) => window.addEventListener(e, once, true));
    return () => events.forEach((e) => window.removeEventListener(e, once, true));
  }, [unlock]);

  // Mute, bus volumes and the running-session duck (spec §3.9).
  const running = state.timer.status === "running";
  useEffect(() => {
    engine.configure({ muted: state.muted, volumes: { ambience: state.volumes.ambience, ui: state.volumes.ui }, uiDucked: running });
  }, [engine, unlocked, state.muted, state.volumes.ambience, state.volumes.ui, running]);

  // Ambience follows the location, and only plays once the user has entered.
  const ambience = getLocation(state.locationId).ambience;
  useEffect(() => {
    if (!unlocked) return;
    if (state.entered) engine.setAmbience(ambience);
    else engine.stopAmbience();
  }, [engine, unlocked, state.entered, ambience]);
  useEffect(() => { engine.setLayerLevels(state.ambienceMix); }, [engine, unlocked, state.entered, ambience, state.ambienceMix]);

  // Interface sounds from state changes (rules in triggers.ts).
  const prev = useRef(state);
  useEffect(() => {
    for (const id of sfxFor(prev.current, state)) engine.playSfx(id);
    prev.current = state;
  }, [engine, state]);

  // A soft tick when a button inside a screen is pressed.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const button = e.target instanceof Element ? e.target.closest("button") : null;
      if (button && button.closest('[role="dialog"]')) engine.playSfx("select");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [engine]);

  const api = useMemo<AudioApi>(() => ({ unlock }), [unlock]);
  return <AudioApiContext.Provider value={api}>{children}</AudioApiContext.Provider>;
}
