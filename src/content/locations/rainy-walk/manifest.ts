import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is empty until track ids are chosen (decision D-09); the TV shows its "unavailable" state.
const manifest: LocationManifest = {
  id: "rainy-walk",
  canonIndex: null,
  character: null,
  speaker: "morgana",
  scene: {},
  playlist: [],
  ambience: [
    { id: "rainy-walk-rain", label: "Rain", synth: "rain" },
    { id: "rainy-walk-city", label: "Footsteps", synth: "city" },
  ],
  lines: {
    arrive: ["Rain again. Good weather for thinking."],
    back: ["Umbrella's still wet from last time."],
    idle: ["Keep walking. Keep thinking."],
    start: ["One step at a time."],
    complete: ["We made it home dry. Mostly."],
  },
  threads: {  },
};

export default manifest;
