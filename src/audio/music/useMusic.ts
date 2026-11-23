import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { TrackRef } from "@/content/types";
import { currentTrack, initialMusic, musicReducer, type MusicEvent, type MusicState } from "./controller";
import { createYouTubeBackend, type BackendFactory, type MusicBackend } from "./youtube";

/** How long a requested play may stay "loading" (with a player present) before we call it blocked by autoplay rules. */
export const BLOCKED_AFTER_MS = 5000;
/** A "playing" event this soon after the user paused a loading track is the video starting late, not a new request. */
export const LATE_PLAY_WINDOW_MS = 4000;

export interface UseMusic {
  state: MusicState;
  send: (event: MusicEvent) => void;
  /** Attach to the box the player is created in. */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Drives one player from the pure state machine. One player per page; created only once the user has interacted
 * (`enabled`), and playback is requested only by user events dispatched through `send`.
 */
export function useMusic({ tracks, resetKey, volume, muted, enabled = true, factory = createYouTubeBackend }: {
  tracks: readonly TrackRef[];
  /** Changing this (a new location) stops playback and resets the TV, even if the playlist is the same. */
  resetKey: string;
  /** 0–1 */
  volume: number;
  muted: boolean;
  /** False until the user's first gesture: no YouTube script, no iframe (spec §4.8). */
  enabled?: boolean;
  factory?: BackendFactory;
}): UseMusic {
  const [state, dispatch] = useReducer(musicReducer, tracks, initialMusic);
  const containerRef = useRef<HTMLDivElement>(null);
  const backend = useRef<MusicBackend | null>(null);
  const loaded = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // When the user pauses while a track is still loading, the video can start a moment later anyway. Remember the pause so
  // the late "playing" is answered with pause() instead of overriding what the user asked for.
  const pausedWhileLoading = useRef<number | null>(null);

  // Travel: a new location always stops the TV and starts from its first track, cued (spec D-26).
  // The key leaves out the player's own links: adding or removing one must not stop what is playing.
  const baseIds = tracks.filter((t) => t.source !== "user").map((t) => t.videoId).join(",");
  const key = `${resetKey}|${baseIds}`;
  const lastKey = useRef(key);
  const allIds = tracks.map((t) => t.videoId).join(",");
  const lastAll = useRef(allIds);
  useEffect(() => {
    if (key !== lastKey.current) {
      lastKey.current = key;
      lastAll.current = allIds;
      dispatch({ type: "SET_PLAYLIST", tracks });
    } else if (allIds !== lastAll.current) {
      lastAll.current = allIds;
      dispatch({ type: "SET_TRACKS", tracks });
    }
  }, [key, allIds, tracks]);

  // The latest state, readable from event handlers without making them depend on it.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Pressing play after the script failed to load tries again.
  const apiFailed = state.apiFailed;
  const send = useCallback((event: MusicEvent) => {
    if ((event.type === "PLAY" || event.type === "PLAY_TRACK") && apiFailed) setAttempt((a) => a + 1);
    pausedWhileLoading.current = event.type === "PAUSE" && stateRef.current.status === "loading" ? Date.now() : null;
    dispatch(event);
  }, [apiFailed]);

  // Create the one player. The AbortSignal makes a cancelled creation (StrictMode, unmount) build nothing.
  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;
    const controller = new AbortController();
    factory(container, {
      onState: (s) => {
        if (s === "playing") {
          const asked = pausedWhileLoading.current;
          if (asked !== null && Date.now() - asked < LATE_PLAY_WINDOW_MS) {
            pausedWhileLoading.current = null;
            backend.current?.pause(); // honour the pause the user pressed before the video started
            return;
          }
          dispatch({ type: "PLAYER_PLAYING" });
        }
        else if (s === "paused") dispatch({ type: "PLAYER_PAUSED" });
        else if (s === "ended") dispatch({ type: "PLAYER_ENDED" });
      },
      onError: (code) => dispatch({ type: "PLAYER_ERROR", code }),
    }, controller.signal)
      .then((b) => {
        if (controller.signal.aborted) { b.destroy(); return; }
        backend.current = b;
        setReady(true);
      })
      .catch(() => { if (!controller.signal.aborted) dispatch({ type: "API_FAILED" }); });
    return () => {
      controller.abort();
      backend.current?.destroy();
      backend.current = null;
      loaded.current = null;
      setReady(false);
    };
  }, [factory, enabled, attempt]);

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

  // A play that never starts WITH a player present is the browser's autoplay policy: say so (spec §3.6 "blocked").
  // While the player is still being created the timer waits, so a slow script is not mistaken for a block.
  useEffect(() => {
    if (state.status !== "loading" || !ready) return;
    const id = setTimeout(() => dispatch({ type: "PLAYER_BLOCKED" }), BLOCKED_AFTER_MS);
    return () => clearTimeout(id);
  }, [state.status, state.index, ready]);

  // Volume is the only mixing control for music (spec §4.8); mute silences it too.
  useEffect(() => {
    const b = backend.current;
    if (!ready || !b) return;
    b.setVolume(Math.round(volume * 100));
    b.setMuted(muted);
  }, [ready, volume, muted]);

  return { state, send, containerRef };
}
