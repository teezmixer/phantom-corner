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
    arrive: ["Good morning! The vegetables are doing well today.", "The herbs smell wonderful today. Do sit.", "I hope the garden isn't too distracting."],
    back: ["Welcome — I made tea, if you'd like some.", "How lovely, you came back.", "I picked a few things for you to take home."],
    idle: ["Take your time. Nothing here grows in a hurry.", "There's no hurry. Truly.", "Shall we begin when you're ready?"],
    start: ["Let's grow something today.", "Let's tend to this carefully.", "Quietly now. Things grow in quiet."],
    complete: ["Lovely work. That deserves a rest.", "That was beautiful to watch.", "Rest a little. Then perhaps tea."],
  },
  threads: { unlock: "haru", arrival: "haru" },
};

export default manifest;
