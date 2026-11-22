import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is empty until track ids are chosen (decision D-09); the TV shows its "unavailable" state.
const manifest: LocationManifest = {
  id: "velvet-room",
  canonIndex: null,
  character: null,
  speaker: "morgana",
  scene: {},
  playlist: [],
  ambience: [
    { id: "velvet-room-hum", label: "Low hum", synth: "hum" },
    { id: "velvet-room-room", label: "A distant voice", synth: "room" },
  ],
  lines: {
    arrive: ["This place again... it feels like a dream."],
    back: ["Back in the blue room."],
    idle: ["Time moves strangely here."],
    start: ["Begin. Time is on your side here."],
    complete: ["Your bonds grow stronger."],
  },
  threads: {  },
};

export default manifest;
