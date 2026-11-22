import { useEffect, useReducer, useRef, useState } from "react";
import type { TrackRef } from "@/content/types";
import { currentTrack, initialMusic, musicReducer, type MusicEvent, type MusicState } from "./controller";
import { createYouTubeBackend, type BackendFactory, type MusicBackend } from "./youtube";

/** How long a requested play may stay "loading" before we call it blocked by the browser's autoplay rules. */
export const BLOCKED_AFTER_MS = 5000;

export interface UseMusic {
  state: MusicState;
  send: (event: MusicEvent) => void;
  /** Attach to the 200×200 box the player is created in. */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Drives one player from the pure state machine. One player per page; created when the TV mounts (after Enter);
 * playback is requested only by user events dispatched through `send`.
 */
export function useMusic({ tracks, volume, muted, factory = createYouTubeBackend }: {
  tracks: readonly TrackRef[];
  /** 0–1 */
  volume: number;
  muted: boolean;
  factory?: BackendFactory;
}): UseMusic {
  const [state, send] = useReducer(musicReducer, tracks, initialMusic);
  const containerRef = useRef<HTMLDivElement>(null);
  const backend = useRef<MusicBackend | null>(null);
  const loaded = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  // A new playlist (travel) resets the TV; playback never carries across on its own.
  const key = tracks.map((t) => t.videoId).join(",");
  const firstKey = useRef(key);
  useEffect(() => {
    if (key === firstKey.current) return;
    firstKey.current = key;
    send({ type: "SET_PLAYLIST", tracks });
  }, [key, tracks]);

  // Create the one player. Idempotent for React StrictMode: a cancelled creation destroys itself.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    factory(container, {
      onState: (s) => {
        if (s === "playing") send({ type: "PLAYER_PLAYING" });
        else if (s === "paused") send({ type: "PLAYER_PAUSED" });
        else if (s === "ended") send({ type: "PLAYER_ENDED" });
      },
      onError: (code) => send({ type: "PLAYER_ERROR", code }),
    })
      .then((b) => {
        if (cancelled) { b.destroy(); return; }
        backend.current = b;
        setReady(true);
      })
      .catch(() => { if (!cancelled) send({ type: "API_FAILED" }); });
    return () => {
      cancelled = true;
      backend.current?.destroy();
      backend.current = null;
      loaded.current = null;
      setReady(false);
    };
  }, [factory]);

  // Make the player match the state. Only "loading" (asked for by the user) ever starts audio.
  const track = currentTrack(state);
  useEffect(() => {
    const b = backend.current;
    if (!ready || !b || !track) return;
    if (state.status === "loading") {
      if (loaded.current !== track.videoId) { loaded.current = track.videoId; b.load(track.videoId, true); }
      else b.play();
    } else if (state.status === "paused") {
      b.pause();
    } else if (state.status === "off" && loaded.current !== track.videoId) {
      loaded.current = track.videoId;
      b.load(track.videoId, false); // cued: shows the video, plays nothing
    }
  }, [ready, state.status, track]);

  // A play that never starts is the browser's autoplay policy: say so (spec §3.6 "blocked").
  useEffect(() => {
    if (state.status !== "loading") return;
    const id = setTimeout(() => send({ type: "PLAYER_BLOCKED" }), BLOCKED_AFTER_MS);
    return () => clearTimeout(id);
  }, [state.status, state.index]);

  // Volume is the only mixing control for music (spec §4.8); mute silences it too.
  useEffect(() => {
    const b = backend.current;
    if (!ready || !b) return;
    b.setVolume(Math.round(volume * 100));
    b.setMuted(muted);
  }, [ready, volume, muted]);

  return { state, send, containerRef };
}
