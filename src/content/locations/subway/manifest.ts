import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is empty until track ids are chosen (decision D-09); the TV shows its "unavailable" state.
const manifest: LocationManifest = {
  id: "subway",
  canonIndex: null,
  character: null,
  speaker: "morgana",
  scene: {},
  playlist: [],
  ambience: [
    { id: "subway-hum", label: "Rails", synth: "hum" },
    { id: "subway-murmur", label: "Announcements", synth: "murmur" },
  ],
  lines: {
    arrive: ["Last train. Find a seat before it fills up."],
    back: ["Same carriage as always."],
    idle: ["Three stops to go. Use them."],
    start: ["Doors closing. Go."],
    complete: ["Our stop. Nicely done."],
  },
  threads: {  },
};

export default manifest;
