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
    arrive: ["Stay close. The tunnels go on forever.", "Careful on the stairs. And in the books.", "It's dark down here. Keep your focus lit."],
    back: ["Down here again? Brave.", "Back in the depths. I knew you would be.", "The tunnels remember you."],
    idle: ["Keep moving. Standing still is dangerous.", "Don't dawdle. Down here, time bites.", "Stay sharp."],
    start: ["Let's dive.", "Descend. One level at a time.", "Eyes up. We go deep."],
    complete: ["Out in one piece. Good.", "Surface reached. Good work.", "That's the way to clear a floor."],
  },
  threads: {  },
};

export default manifest;
