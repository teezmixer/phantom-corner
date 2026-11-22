import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is empty until track ids are chosen (decision D-09); the TV shows its "unavailable" state.
const manifest: LocationManifest = {
  id: "akechi",
  canonIndex: 7,
  character: "Akechi",
  speaker: "akechi",
  scene: {},
  playlist: [],
  ambience: [
    { id: "akechi-murmur", label: "Glasses and low talk", synth: "murmur" },
    { id: "akechi-room", label: "Brushed drums", synth: "room" },
  ],
  lines: {
    arrive: ["You came late. So did I. Shall we?"],
    back: ["Back again. Persistence suits you."],
    idle: ["Waiting is a skill. Don't overdo it."],
    start: ["Let's see what you're capable of."],
    complete: ["Impressive. I'll admit that much."],
  },
  threads: { unlock: "akechi-unlock", arrival: "akechi-arrival" },
};

export default manifest;
