import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "akechi",
  canonIndex: 7,
  character: "Akechi",
  speaker: "akechi",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "akechi-murmur", label: "Glasses and low talk", synth: "murmur" },
    { id: "akechi-room", label: "Brushed drums", synth: "room" },
  ],
  lines: {
    arrive: ["You came late. So did I. Shall we?", "Coffee, black. The seat is yours.", "Don't mistake the quiet for leniency."],
    back: ["Back again. Persistence suits you.", "Predictable. I find it reassuring, oddly.", "Back so soon. Good."],
    idle: ["Waiting is a skill. Don't overdo it.", "You're thinking. Good. Don't stop.", "Time doesn't wait. Neither do I."],
    start: ["Let's see what you're capable of.", "Begin. I'll be taking notes.", "Show me this isn't luck."],
    complete: ["Impressive. I'll admit that much.", "Adequate. Better than adequate, perhaps.", "I'll withhold further comment. For now."],
  },
  threads: { unlock: "akechi-unlock", arrival: "akechi-arrival" },
};

export default manifest;
