import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is empty until track ids are chosen (decision D-09); the TV shows its "unavailable" state.
const manifest: LocationManifest = {
  id: "ann",
  canonIndex: 2,
  character: "Ann",
  speaker: "ann",
  scene: {},
  playlist: [],
  ambience: [
    { id: "ann-murmur", label: "Street chatter", synth: "murmur" },
    { id: "ann-city", label: "Crossing signal", synth: "city" },
  ],
  lines: {
    arrive: ["Over here! I saved you the sunny seat."],
    back: ["Hey, you came back! Crepes after?"],
    idle: ["Ready when you are."],
    start: ["Okay, focus mode. You too."],
    complete: ["See? Way less scary than it looked."],
  },
  threads: { unlock: "ann-unlock", arrival: "ann-arrival" },
};

export default manifest;
