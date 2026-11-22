import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "velvet-room",
  canonIndex: null,
  character: null,
  speaker: "morgana",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
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
