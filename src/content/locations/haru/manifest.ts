import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "haru",
  canonIndex: 6,
  character: "Haru",
  speaker: "haru",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "haru-wind", label: "Morning breeze", synth: "wind" },
    { id: "haru-room", label: "Watering can", synth: "room" },
  ],
  lines: {
    arrive: ["Good morning! The vegetables are doing well today."],
    back: ["Welcome — I made tea, if you'd like some."],
    idle: ["Take your time. Nothing here grows in a hurry."],
    start: ["Let's grow something today."],
    complete: ["Lovely work. That deserves a rest."],
  },
  threads: { unlock: "haru-unlock", arrival: "haru-arrival" },
};

export default manifest;
