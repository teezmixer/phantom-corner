import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// No sign art: Ares's drawn Leblanc sign is paused (decision D-21). Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "leblanc",
  canonIndex: 0,
  character: "Sojiro & Morgana",
  speaker: "sojiro",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "leblanc-rain", label: "Rain on glass", synth: "rain" },
    { id: "leblanc-murmur", label: "Caf\u00e9 murmur", synth: "murmur" },
  ],
  lines: {
    arrive: ["Door's open. Sit wherever.", "Wipe your feet. Then sit.", "The curry takes a while. So does studying."],
    back: ["Ah, you're back.", "Same seat, I suppose.", "The coffee's fresh. The complaints are too."],
    idle: ["Coffee's not going to drink itself.", "The clock's not going to stop for you.", "You staring at the cup won't fill it."],
    start: ["Quiet hours. Good.", "Go on, then. I'll be here.", "Books open. Phone down."],
    complete: ["Not bad. Coffee's on me. Once.", "Hm. Acceptable work.", "Don't let it go to your head."],
  },
  threads: { arrival: "leblanc-first-visit" },
};

export default manifest;
