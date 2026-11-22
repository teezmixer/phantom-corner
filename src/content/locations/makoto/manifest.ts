import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is empty until track ids are chosen (decision D-09); the TV shows its "unavailable" state.
const manifest: LocationManifest = {
  id: "makoto",
  canonIndex: 4,
  character: "Makoto",
  speaker: "makoto",
  scene: {},
  playlist: [],
  ambience: [
    { id: "makoto-room", label: "Pages and pencil", synth: "room" },
    { id: "makoto-hum", label: "Wall clock", synth: "hum" },
  ],
  lines: {
    arrive: ["Good. You found it. Phones on silent, please."],
    back: ["Same table as last time. I kept it free."],
    idle: ["Set a goal first. Then begin."],
    start: ["Starting now. No distractions."],
    complete: ["Efficient. I'm impressed."],
  },
  threads: { unlock: "makoto-unlock", arrival: "makoto-arrival" },
};

export default manifest;
