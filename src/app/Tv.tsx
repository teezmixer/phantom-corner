import { useEffect, useState } from "react";
import { CaretLeft, CaretRight, Pause, Play, SlidersHorizontal } from "@phosphor-icons/react";
import { currentTrack, isActive, type MusicStatus } from "@/audio/music/controller";
import { useMusic } from "@/audio/music/useMusic";
import type { BackendFactory } from "@/audio/music/youtube";
import { widgets } from "@/content/copy";
import { getLocation } from "@/content/registry";
import { DEFAULT_SLOTS } from "@/hud/slots";
import { useStore } from "@/state/StoreProvider";
import { Mixer } from "./Mixer";

/** The player box is exactly 200×200 CSS px: YouTube's minimum (spec §4.8). It is never scaled, covered or hidden. */
const PLAYER_PX = 200;
const STRIP_PX = 44;
const todo = DEFAULT_SLOTS.todo;
const sign = DEFAULT_SLOTS.location;

function caption(status: MusicStatus, title: string | undefined): string {
  switch (status) {
    case "off": return widgets.musicOff;
    case "loading": return widgets.musicLoading;
    case "playing": return title ?? widgets.musicOff;
    case "paused": return title ? `Paused — ${title}` : widgets.musicOff;
    case "blocked": return widgets.musicBlocked;
    case "unavailable": return widgets.musicUnavailable;
  }
}

/**
 * The LeBlanc TV: the one YouTube player. Always visible at ≥200×200, above every screen (screens leave it a gutter),
 * never hidden by Hide UI, started only by the user (spec §4.8). Our controls sit BESIDE the video, never over it;
 * the caption and mixer open to its left, over the scene only. Placement is provisional: DECISION: tv-placement (D-05).
 */
export function Tv({ scale, factory }: { scale: number; factory?: BackendFactory }) {
  const { state } = useStore();
  const { playlist } = getLocation(state.locationId);
  const { state: musicState, send, containerRef } = useMusic({ tracks: playlist, volume: state.volumes.music, muted: state.muted, factory });
  const [mixer, setMixer] = useState(false);
  const status = musicState.status;
  const title = currentTrack(musicState)?.title;
  const active = isActive(musicState);
  const blocked = status === "unavailable";

  useEffect(() => {
    if (!mixer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMixer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mixer]);

  // Centred in the free band between the todo widget and the location sign, so nothing is ever over the player.
  const todoBottom = (todo.y + todo.h) * scale;
  const signSpace = (sign.y + sign.h) * scale;
  const top = `calc(${todoBottom}px + (100dvh - ${todoBottom + signSpace}px - ${PLAYER_PX}px) / 2)`;

  const button = "grid size-9 place-items-center border border-white bg-black text-white hover:bg-redbright focus-visible:outline-2 focus-visible:outline-accentteal disabled:border-dashed disabled:text-greylight disabled:hover:bg-black";
  return (
    <section aria-label="TV" className="pointer-events-auto absolute z-[55] flex font-body-primary text-white" style={{ right: 39 * scale, top, height: PLAYER_PX }}>
      <div role="status" aria-live="polite" className="absolute bottom-0 right-full mr-2 w-56 border-2 border-white bg-black px-2 py-1 text-right text-xs">
        {caption(status, title)}
      </div>
      {mixer && <div className="absolute right-full top-0 mr-2"><Mixer /></div>}
      <div className="flex flex-col items-center justify-center gap-1 border-2 border-r-0 border-white bg-black" style={{ width: STRIP_PX }}>
        <button type="button" className={button} aria-label="Previous track" disabled={blocked} onClick={() => send({ type: "PREV" })}><CaretLeft size={18} /></button>
        <button type="button" className={button} aria-label={active ? "Pause" : "Play"} disabled={blocked} onClick={() => send({ type: active ? "PAUSE" : "PLAY" })}>
          {active ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
        </button>
        <button type="button" className={button} aria-label="Next track" disabled={blocked} onClick={() => send({ type: "NEXT" })}><CaretRight size={18} /></button>
        <button type="button" className={button} aria-label="Mixer" aria-expanded={mixer} onClick={() => setMixer((m) => !m)}><SlidersHorizontal size={18} /></button>
      </div>
      <div ref={containerRef} data-testid="tv-player" className="shrink-0 overflow-hidden border-2 border-white bg-black" style={{ width: PLAYER_PX + 4, height: PLAYER_PX }} />
    </section>
  );
}
