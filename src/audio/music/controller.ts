import type { TrackRef } from "@/content/types";

/** What the TV shows (spec §3.6). */
export type MusicStatus = "off" | "loading" | "playing" | "paused" | "blocked" | "unavailable";

export interface MusicState {
  tracks: readonly TrackRef[];
  /** Index of the current track. */
  index: number;
  status: MusicStatus;
  /** Tracks that failed to load or play this visit, skipped from then on. */
  failed: readonly number[];
  /** The YouTube script could not be loaded. Pressing play tries again. */
  apiFailed: boolean;
}

export type MusicEvent =
  /** A new playlist (travel). Playback stops: it only ever starts from the user pressing play. */
  | { type: "SET_PLAYLIST"; tracks: readonly TrackRef[] }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "PLAYER_PLAYING" }
  | { type: "PLAYER_PAUSED" }
  | { type: "PLAYER_ENDED" }
  | { type: "PLAYER_ERROR"; code: number }
  /** Play was requested but the browser did not start it (autoplay policy). */
  | { type: "PLAYER_BLOCKED" }
  /** The YouTube script could not be loaded (offline, blocked). */
  | { type: "API_FAILED" };

export function initialMusic(tracks: readonly TrackRef[] = []): MusicState {
  return { tracks, index: 0, status: tracks.length > 0 ? "off" : "unavailable", failed: [], apiFailed: false };
}

/** YouTube player errors that mean "this video cannot play here": invalid id, HTML5 error, removed, embedding off. */
export const SKIP_ERROR_CODES = [2, 5, 100, 101, 150, 153] as const;

/** The next playable index after `from` in `direction`, skipping failed tracks; null when every track failed. */
export function nextIndex(state: Pick<MusicState, "tracks" | "failed">, from: number, direction: 1 | -1): number | null {
  const n = state.tracks.length;
  for (let step = 1; step <= n; step++) {
    const i = (((from + direction * step) % n) + n) % n;
    if (!state.failed.includes(i)) return i;
  }
  return null;
}

export const currentTrack = (s: MusicState): TrackRef | null => s.tracks[s.index] ?? null;

/** Statuses in which a track is being loaded or played (audio is, or is about to be, coming out). */
export const isActive = (s: MusicState): boolean => s.status === "loading" || s.status === "playing";

/**
 * The TV's state machine, pure so every rule is testable. Playback starts only from PLAY/NEXT/PREV (user actions);
 * unplayable tracks are skipped silently; when every track fails the TV says so (spec §3.6, §4.8).
 */
export function musicReducer(state: MusicState, event: MusicEvent): MusicState {
  switch (event.type) {
    case "SET_PLAYLIST":
      // A new playlist (travel) stops playback. A failed script stays failed until the user presses play again.
      return state.apiFailed ? { ...initialMusic(event.tracks), apiFailed: true, status: "unavailable" } : initialMusic(event.tracks);
    case "API_FAILED":
      return { ...state, apiFailed: true, status: "unavailable" };
    case "PLAY":
      if (state.tracks.length === 0) return { ...state, status: "unavailable" };
      if (state.apiFailed) return { ...state, apiFailed: false, status: "loading" }; // a retry
      if (state.status === "playing" || state.status === "loading") return state;
      return { ...state, status: "loading" };
    case "PAUSE":
      return state.status === "playing" || state.status === "loading" ? { ...state, status: "paused" } : state;
    case "NEXT":
    case "PREV": {
      if (state.tracks.length === 0) return { ...state, status: "unavailable" };
      const i = nextIndex(state, state.index, event.type === "NEXT" ? 1 : -1);
      return i === null ? { ...state, status: "unavailable" } : { ...state, index: i, status: "loading" };
    }
    // The player's own state is the truth about what is audible. If the user clicks the video itself (a real user action,
    // and YouTube's own controls stay on it), the caption must follow rather than disagree with the sound.
    case "PLAYER_PLAYING":
      return state.status === "unavailable" ? state : { ...state, status: "playing" };
    case "PLAYER_PAUSED":
      return state.status === "playing" || state.status === "loading" ? { ...state, status: "paused" } : state;
    case "PLAYER_ENDED": {
      // A track that ends moves on ONLY if it was playing. A paused, off or unavailable TV never starts another track by itself.
      if (state.status !== "playing") return state;
      const i = nextIndex(state, state.index, 1);
      return i === null ? { ...state, status: "unavailable" } : { ...state, index: i, status: "loading" };
    }
    case "PLAYER_ERROR": {
      if (!(SKIP_ERROR_CODES as readonly number[]).includes(event.code)) return state;
      const failed = state.failed.includes(state.index) ? state.failed : [...state.failed, state.index];
      const i = nextIndex({ tracks: state.tracks, failed }, state.index, 1);
      // Skip silently to the next playable track; only when all have failed does the TV say it is unavailable.
      return i === null ? { ...state, failed, status: "unavailable" } : { ...state, failed, index: i, status: state.status === "loading" || state.status === "playing" ? "loading" : state.status };
    }
    case "PLAYER_BLOCKED":
      return state.status === "loading" ? { ...state, status: "blocked" } : state;
  }
}
