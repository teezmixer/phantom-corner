import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// No sign art: Ares's drawn Leblanc sign is paused (decision D-21). Playlist is empty until track ids are chosen (decision D-09); the TV shows its "unavailable" state.
const manifest: LocationManifest = {
  id: "leblanc",
  canonIndex: 0,
  character: "Sojiro & Morgana",
  speaker: "sojiro",
  scene: {},
  playlist: [],
  ambience: [
    { id: "leblanc-rain", label: "Rain on glass", synth: "rain" },
    { id: "leblanc-murmur", label: "Caf\u00e9 murmur", synth: "murmur" },
  ],
  lines: {
    arrive: ["Door's open. Sit wherever."],
    back: ["Ah, you're back."],
    idle: ["Coffee's not going to drink itself."],
    start: ["Quiet hours. Good."],
    complete: ["Not bad. Coffee's on me. Once."],
  },
  threads: { arrival: "leblanc-first-visit" },
};

export default manifest;
