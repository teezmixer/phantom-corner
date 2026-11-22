import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is empty until track ids are chosen (decision D-09); the TV shows its "unavailable" state.
const manifest: LocationManifest = {
  id: "yusuke",
  canonIndex: 3,
  character: "Yusuke",
  speaker: "yusuke",
  scene: {},
  playlist: [],
  ambience: [
    { id: "yusuke-room", label: "Brush on paper", synth: "room" },
    { id: "yusuke-wind", label: "Birds outside", synth: "wind" },
  ],
  lines: {
    arrive: ["Ah. The light here is ideal for concentration. Sit."],
    back: ["You return. The composition is complete."],
    idle: ["Inspiration rewards the patient."],
    start: ["Let us both create."],
    complete: ["Exquisite discipline."],
  },
  threads: { unlock: "yusuke-unlock", arrival: "yusuke-arrival" },
};

export default manifest;
