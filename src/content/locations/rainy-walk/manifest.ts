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
    arrive: ["Rain again. Good weather for thinking.", "Mind the puddles. And the homework.", "The streets are empty. Perfect."],
    back: ["Umbrella's still wet from last time.", "The same lamp posts. The same rain.", "Right on time, as always."],
    idle: ["Keep walking. Keep thinking.", "Don't stand in the rain wondering. Start.", "Think of it as a stroll with a purpose."],
    start: ["One step at a time.", "Footsteps and focus. That's all.", "Umbrella up. Mind down."],
    complete: ["We made it home dry. Mostly.", "Home, and the work is done.", "Not a single puddle in the way."],
  },
  threads: {  },
};

export default manifest;
