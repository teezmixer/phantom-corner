import type { TrackRef } from "./types";

/**
 * PROVISIONAL TV playlist (decision D-09 / D-26) — every location uses it until Ares chooses per-location music.
 * Rights-holder uploads only (spec §4.8): "Lyn - Topic" tracks are the label's own auto-generated uploads.
 * Embeddability was checked with YouTube's oEmbed endpoint on `checkedOn` (HTTP 200 = exists and embeddable).
 * Re-check before relying on them: a weekly check is planned for M10.
 */
export const PLACEHOLDER_PLAYLIST: TrackRef[] = [
  { videoId: "woz5qvDdMRM", title: "Beneath the Mask", source: "rights-holder", checkedOn: "2026-11-22" },
  { videoId: "U2Qd9TRY1Ro", title: "Beneath the Mask (rain)", source: "rights-holder", checkedOn: "2026-11-22" },
  { videoId: "w7Cm74nDhac", title: "Beneath the Mask (instrumental)", source: "rights-holder", checkedOn: "2026-11-22" },
];
