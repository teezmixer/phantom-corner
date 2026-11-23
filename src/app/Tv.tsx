import { useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, Pause, Play, SlidersHorizontal } from "@phosphor-icons/react";
import { useAudio } from "@/audio/AudioProvider";
import { track } from "./analytics";
import { currentTrack, isActive, type MusicStatus } from "@/audio/music/controller";
import { useMusic } from "@/audio/music/useMusic";
import type { BackendFactory } from "@/audio/music/youtube";
import { ui, widgets } from "@/content/copy";
import { getLocation } from "@/content/registry";
import { DEFAULT_SLOTS } from "@/hud/slots";
import { useStore } from "@/state/StoreProvider";
import { Mixer } from "./Mixer";

/**
 * The player's INNER area is exactly 200×200 CSS px, YouTube's minimum (spec §4.8): the box is 200 plus its 2 px
 * border on each side (the app uses border-box sizing), so the border never eats into the video.
 */
const PLAYER_PX = 200;
const BORDER_PX = 2;
const BOX_PX = PLAYER_PX + 2 * BORDER_PX;
const STRIP_PX = 44;
const todo = DEFAULT_SLOTS.todo;
const sign = DEFAULT_SLOTS.location;

function caption(status: MusicStatus, title: string | undefined): string {
  switch (status) {
    case "off": return widgets.musicOff;
    case "loading": return widgets.musicLoading;
    case "playing": return title ?? widgets.musicOff;
    case "paused": return title ? widgets.musicPaused(title) : widgets.musicOff;
    case "blocked": return widgets.musicBlocked;
    case "unavailable": return widgets.musicUnavailable;
  }
}

/**
 * The LeBlanc TV: the one YouTube player. Always visible at ≥200×200, above every screen (screens leave it a gutter),
 * never hidden by Hide UI, started only by the user (spec §4.8). Our controls sit BESIDE the video, never over it, and
 * YouTube's own chrome stays on it. The caption and mixer open to its left over the scene only, and step aside
 * (caption stays for screen readers) while a screen is open so they never cover a dialog.
 * Placement is provisional: DECISION: tv-placement (D-05).
 */
export function Tv({ scale, locked = false, factory }: { scale: number; locked?: boolean; factory?: BackendFactory }) {
  const { state } = useStore();
  const { gestured } = useAudio();
  const { playlist } = getLocation(state.locationId);
  // The player (and the YouTube script) wait for the user's first gesture: demo and dev modes skip the splash.
  const { state: musicState, send, containerRef } = useMusic({ tracks: playlist, resetKey: state.locationId, volume: state.volumes.music, muted: state.muted, enabled: gestured, factory });
  const [mixer, setMixer] = useState(false);
  const mixerButton = useRef<HTMLButtonElement>(null);
  const status = musicState.status;
  const title = currentTrack(musicState)?.title;
  const active = isActive(musicState);
  // Everything is unavailable only when no retry can help: no tracks, or every track failed (not a failed script).
  const dead = status === "unavailable" && !musicState.apiFailed;
  const mixerOpen = mixer && !locked;

  // Analytics (spec §4.16): music played when it starts playing, a track unavailable each time one fails. Not in the demo.
  const demo = state.demo;
  const locationId = state.locationId;
  const failedCount = musicState.failed.length;
  const wasPlaying = useRef(false);
  const failedBefore = useRef(0);
  useEffect(() => {
    if (status === "playing" && !wasPlaying.current && !demo) track("music_played", { location: locationId });
    wasPlaying.current = status === "playing";
  }, [status, demo, locationId]);
  useEffect(() => {
    if (failedCount > failedBefore.current && !demo) track("track_unavailable", { location: locationId });
    failedBefore.current = failedCount;
  }, [failedCount, demo, locationId]);

  useEffect(() => {
    if (!mixerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMixer(false); mixerButton.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mixerOpen]);

  // Centred in the free band between the todo widget and the location sign. On a short window the band is smaller than
  // the player: then the TV sits just below the todo widget and the sign gives way — the player is never the one covered.
  const todoBottom = (todo.y + todo.h) * scale;
  const signSpace = (sign.y + sign.h) * scale;
  const centred = `calc(${todoBottom}px + (100dvh - ${todoBottom + signSpace}px - ${BOX_PX}px) / 2)`;
  // …but never lower than the window allows: on a very short window (heavy zoom) the player stays fully on screen even
  // if it then overlaps the todo widget.
  const top = `min(max(${todoBottom + 4}px, ${centred}), calc(100dvh - ${BOX_PX}px))`;

  const button = "grid size-9 place-items-center border border-white bg-black text-white hover:bg-redbright focus-visible:outline-2 focus-visible:outline-accentteal disabled:border-dashed disabled:text-greylight disabled:hover:bg-black";
  return (
    <section aria-label={ui.tv.region} className="pointer-events-auto absolute z-[55] flex font-body-primary text-white" style={{ right: 39 * scale, top, height: BOX_PX }}>
      <div role="status" aria-live="polite" className={locked ? "sr-only" : "absolute bottom-0 right-full mr-2 w-56 border-2 border-white bg-black px-2 py-1 text-right text-xs"}>
        {caption(status, title)}
      </div>
      {mixerOpen && <div className="absolute right-full top-0 mr-2"><Mixer /></div>}
      <div className="flex flex-col items-center justify-center gap-1 border-2 border-r-0 border-white bg-black" style={{ width: STRIP_PX }}>
        <button type="button" className={button} aria-label={ui.tv.previous} disabled={dead} onClick={() => send({ type: "PREV" })}><CaretLeft size={18} /></button>
        <button type="button" className={button} aria-label={active ? ui.tv.pause : ui.tv.play} disabled={dead} onClick={() => send({ type: active ? "PAUSE" : "PLAY" })}>
          {active ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
        </button>
        <button type="button" className={button} aria-label={ui.tv.next} disabled={dead} onClick={() => send({ type: "NEXT" })}><CaretRight size={18} /></button>
        <button type="button" ref={mixerButton} className={button} aria-label={ui.mixer} aria-expanded={mixerOpen} onClick={() => setMixer((m) => !m)}><SlidersHorizontal size={18} /></button>
      </div>
      <div ref={containerRef} data-testid="tv-player" className="shrink-0 overflow-hidden border-2 border-white bg-black" style={{ width: BOX_PX, height: BOX_PX }} />
    </section>
  );
}
