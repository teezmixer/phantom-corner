import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getLocation } from "@/content/registry";
import { useStore } from "@/state/StoreProvider";
import { AudioEngine } from "./engine";
import type { SfxId } from "./sfx";
import { sfxFor } from "./triggers";

interface AudioApi {
  /** Create/resume the AudioContext. Call from a user gesture (the splash click does). */
  unlock(): void;
  /** True once the user has made any gesture. The YouTube script and player wait for it (spec §4.8). */
  gestured: boolean;
  /** Play one interface sound now (muting, the volume and the running-session duck still apply). */
  play(id: SfxId): void;
}

// Outside a provider (component tests) there is nothing to wait for.
const AudioApiContext = createContext<AudioApi>({ unlock: () => undefined, gestured: true, play: () => undefined });

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
  const [gestured, setGestured] = useState(false);

  const unlock = useCallback(() => {
    engine.unlock();
    setUnlocked(engine.unlocked);
  }, [engine]);

  // Every gesture (re)tries to unlock audio: the splash button does it explicitly, demo and dev modes skip the splash,
  // and a context that was suspended (iOS interruption, a gesture the browser did not accept) resumes on the next one.
  // unlock() is idempotent and cheap, so the listeners stay for the life of the page.
  useEffect(() => {
    const events = ["pointerdown", "keydown", "touchend", "click"] as const;
    const onGesture = () => { setGestured(true); unlock(); };
    events.forEach((e) => window.addEventListener(e, onGesture, true));
    return () => events.forEach((e) => window.removeEventListener(e, onGesture, true));
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
  const pendingSelect = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const sounds = sfxFor(prev.current, state);
    prev.current = state;
    if (sounds.length === 0) return;
    // A button press that also changed the screen gets that screen's sound, not an extra tick on top of it.
    if (pendingSelect.current) { clearTimeout(pendingSelect.current); pendingSelect.current = null; }
    for (const id of sounds) engine.playSfx(id);
  }, [engine, state]);

  // A soft tick when a button inside a screen is pressed — unless the press brings its own sound (menu close, travel…),
  // which the state effect above plays within a moment and uses to cancel this tick.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const button = e.target instanceof Element ? e.target.closest("button") : null;
      if (!button || !button.closest('[role="dialog"]')) return;
      if (pendingSelect.current) clearTimeout(pendingSelect.current);
      pendingSelect.current = setTimeout(() => { pendingSelect.current = null; engine.playSfx("select"); }, 60);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      if (pendingSelect.current) clearTimeout(pendingSelect.current);
    };
  }, [engine]);

  const play = useCallback((id: SfxId) => engine.playSfx(id), [engine]);
  const api = useMemo<AudioApi>(() => ({ unlock, gestured, play }), [unlock, gestured, play]);
  return <AudioApiContext.Provider value={api}>{children}</AudioApiContext.Provider>;
}
