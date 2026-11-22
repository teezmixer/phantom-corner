import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "rainy-walk",
  canonIndex: null,
  character: null,
  speaker: "morgana",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
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
