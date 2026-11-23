/**
 * Reading a YouTube link the player pastes (the TV's "add your own link"). Pure. Only the 11-character video id is ever kept
 * and used, so nothing else in a pasted address (a playlist, a time, a tracking tag) reaches the player or the saved data.
 */
const ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"]);

export const isVideoId = (s: unknown): s is string => typeof s === "string" && ID.test(s);

/** The video id in a pasted link or bare id, or null if it is not a single YouTube video. */
export function parseYouTubeId(input: string): string | null {
  const text = input.trim();
  if (isVideoId(text)) return text;
  let url: URL;
  try { url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!HOSTS.has(url.hostname.toLowerCase())) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const candidate = url.hostname.toLowerCase() === "youtu.be" ? parts[0] : parts[0] === "watch" ? url.searchParams.get("v") : ["embed", "shorts", "live", "v"].includes(parts[0] ?? "") ? parts[1] : null;
  return isVideoId(candidate) ? candidate : null;
}

/** The most links a player may keep. The oldest makes room for a new one. */
export const MAX_USER_TRACKS = 10;
