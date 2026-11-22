import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is empty until track ids are chosen (decision D-09); the TV shows its "unavailable" state.
const manifest: LocationManifest = {
  id: "futaba",
  canonIndex: 5,
  character: "Futaba",
  speaker: "futaba",
  scene: {},
  playlist: [],
  ambience: [
    { id: "futaba-hum", label: "Computer fans", synth: "hum" },
    { id: "futaba-city", label: "Muffled city", synth: "city" },
  ],
  lines: {
    arrive: ["oh. you're actually here. don't touch the cables."],
    back: ["you again. ok. that's fine. good, even."],
    idle: ["compiling... your motivation."],
    start: ["entering flow state. do not disturb."],
    complete: ["nice run. saving your stats."],
  },
  threads: { unlock: "futaba-unlock", arrival: "futaba-arrival" },
};

export default manifest;
