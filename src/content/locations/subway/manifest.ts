import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "subway",
  canonIndex: null,
  character: null,
  speaker: "morgana",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "subway-hum", label: "Rails", synth: "hum" },
    { id: "subway-murmur", label: "Announcements", synth: "murmur" },
  ],
  lines: {
    arrive: ["Last train. Find a seat before it fills up."],
    back: ["Same carriage as always."],
    idle: ["Three stops to go. Use them."],
    start: ["Doors closing. Go."],
    complete: ["Our stop. Nicely done."],
  },
  threads: {  },
};

export default manifest;
