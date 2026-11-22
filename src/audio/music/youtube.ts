/**
 * The only file that knows about YouTube's IFrame API (spec §4.8). Everything else talks to `MusicBackend`, so tests
 * use a fake and the player can be swapped. The script is loaded when the TV mounts — after the user has entered —
 * never at page load.
 */
export type PlayerEvent = "playing" | "paused" | "ended" | "buffering" | "cued" | "unstarted";

export interface Handlers {
  onState(state: PlayerEvent): void;
  /** YouTube error code (2, 5, 100, 101, 150, 153 …). */
  onError(code: number): void;
}

export interface MusicBackend {
  /** Load a track; `play` true starts it (only ever after a user action), false just shows it cued. */
  load(videoId: string, play: boolean): void;
  play(): void;
  pause(): void;
  /** 0–100 */
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  destroy(): void;
}

/** `signal` aborts when the TV unmounts or the effect is re-run (React StrictMode): the factory must then create nothing. */
export type BackendFactory = (container: HTMLElement, handlers: Handlers, signal?: AbortSignal) => Promise<MusicBackend>;

interface YTPlayer {
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  setVolume(v: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
}
interface YTApi {
  Player: new (
    el: HTMLElement,
    opts: {
      width: number;
      height: number;
      host?: string;
      playerVars: Record<string, string | number>;
      events: { onReady(): void; onStateChange(e: { data: number }): void; onError(e: { data: number }): void };
    },
  ) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SRC = "https://www.youtube.com/iframe_api";
const LOAD_TIMEOUT_MS = 10_000;
const READY_TIMEOUT_MS = 10_000;
let apiPromise: Promise<YTApi> | null = null;

/** Load the IFrame API once per page. Rejects offline, when blocked, or on timeout. */
export function loadYouTubeApi(): Promise<YTApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise<YTApi>((resolve, reject) => {
    const timeout = setTimeout(() => { apiPromise = null; reject(new Error("YouTube API timed out")); }, LOAD_TIMEOUT_MS);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      if (window.YT?.Player) resolve(window.YT);
      else { apiPromise = null; reject(new Error("YouTube API did not initialise")); }
    };
    const script = document.createElement("script");
    script.src = API_SRC;
    script.async = true;
    script.onerror = () => { clearTimeout(timeout); apiPromise = null; reject(new Error("YouTube API failed to load")); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

const STATE: Record<number, PlayerEvent> = { [-1]: "unstarted", 0: "ended", 1: "playing", 2: "paused", 3: "buffering", 5: "cued" };

/** Our own controls drive the player through the API; the iframe keeps its attribution and is never altered or covered. */
export const createYouTubeBackend: BackendFactory = async (container, handlers, signal) => {
  const YT = await loadYouTubeApi();
  // Nothing is created for a cancelled request (StrictMode runs effects twice; only one iframe may exist).
  if (signal?.aborted) throw new Error("cancelled");
  const mount = document.createElement("div");
  container.appendChild(mount);
  return new Promise<MusicBackend>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("YouTube player did not become ready")), READY_TIMEOUT_MS);
    const player = new YT.Player(mount, {
      width: 200,
      height: 200,
      // Default player chrome stays (spec §4.8: do not alter the player). The privacy-enhanced host is used; `origin`
      // lets YouTube identify the site; Referrer-Policy stays strict-origin-when-cross-origin (M10).
      host: "https://www.youtube-nocookie.com",
      playerVars: { playsinline: 1, rel: 0, origin: window.location.origin },
      events: {
        onReady: () => { clearTimeout(timeout); resolve({
          load: (id, play) => (play ? player.loadVideoById(id) : player.cueVideoById(id)),
          play: () => player.playVideo(),
          pause: () => player.pauseVideo(),
          setVolume: (v) => player.setVolume(v),
          setMuted: (m) => (m ? player.mute() : player.unMute()),
          destroy: () => { try { player.destroy(); } catch { /* already gone */ } },
        }); },
        onStateChange: (e) => { const s = STATE[e.data]; if (s) handlers.onState(s); },
        onError: (e) => handlers.onError(e.data),
      },
    });
  });
};
