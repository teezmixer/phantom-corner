import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "ann",
  canonIndex: 2,
  character: "Ann",
  speaker: "ann",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "ann-murmur", label: "Street chatter", synth: "murmur" },
    { id: "ann-city", label: "Crossing signal", synth: "city" },
  ],
  lines: {
    arrive: ["Over here! I saved you the sunny seat.", "The crepe place is right there. Reward later, okay?", "Isn't this spot nice? I picked it."],
    back: ["Hey, you came back! Crepes after?", "Missed you! Ready to work?", "Same bench. Same sunshine."],
    idle: ["Ready when you are.", "No rush. But maybe a little rush.", "Want me to quiz you? I'm kidding. Mostly."],
    start: ["Okay, focus mode. You too.", "Let's do this together!", "Ready, set, study!"],
    complete: ["See? Way less scary than it looked.", "You were so focused! I'm proud of you.", "Crepes. You've earned crepes."],
  },
  threads: { unlock: "ann", arrival: "ann" },
};

export default manifest;
