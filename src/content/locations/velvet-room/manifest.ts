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
    arrive: ["This place again... it feels like a dream.", "Welcome, again. Time stands still here.", "The room is quiet. Make it count."],
    back: ["Back in the blue room.", "You return to the blue room. Good.", "The key still fits."],
    idle: ["Time moves strangely here.", "There is no clock here. Imagine one.", "A moment of reflection never hurts."],
    start: ["Begin. Time is on your side here.", "Then let us begin your work.", "The room waits for your focus."],
    complete: ["Your bonds grow stronger.", "A job well done. Your progress shows.", "You leave stronger than you arrived."],
  },
  threads: {  },
};

export default manifest;
