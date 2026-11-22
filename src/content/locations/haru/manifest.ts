import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is empty until track ids are chosen (decision D-09); the TV shows its "unavailable" state.
const manifest: LocationManifest = {
  id: "haru",
  canonIndex: 6,
  character: "Haru",
  speaker: "haru",
  scene: {},
  playlist: [],
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
