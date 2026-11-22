import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "mementos",
  canonIndex: null,
  character: null,
  speaker: "morgana",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "mementos-wind", label: "Tunnel wind", synth: "wind" },
    { id: "mementos-hum", label: "Rumble", synth: "hum" },
  ],
  lines: {
    arrive: ["Stay close. The tunnels go on forever."],
    back: ["Down here again? Brave."],
    idle: ["Keep moving. Standing still is dangerous."],
    start: ["Let's dive."],
    complete: ["Out in one piece. Good."],
  },
  threads: {  },
};

export default manifest;
