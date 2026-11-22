import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "ryuji",
  canonIndex: 1,
  character: "Ryuji",
  speaker: "ryuji",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "ryuji-wind", label: "Rooftop wind", synth: "wind" },
    { id: "ryuji-city", label: "Sports field, far off", synth: "city" },
  ],
  lines: {
    arrive: ["Yo! Took you long enough. Pull up a chair — well, a crate."],
    back: ["Back on the roof, huh? Nice."],
    idle: ["C'mon, let's knock this out."],
    start: ["Alright, sprint time!"],
    complete: ["Dude, that was solid!"],
  },
  threads: { unlock: "ryuji-unlock", arrival: "ryuji-arrival" },
};

export default manifest;
