import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "makoto",
  canonIndex: 4,
  character: "Makoto",
  speaker: "makoto",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "makoto-room", label: "Pages and pencil", synth: "room" },
    { id: "makoto-hum", label: "Wall clock", synth: "hum" },
  ],
  lines: {
    arrive: ["Good. You found it. Phones on silent, please.", "Quiet voices only. Thank you.", "I reserved a table by the window."],
    back: ["Same table as last time. I kept it free.", "Good to see you on time.", "I kept the schedule clear for us."],
    idle: ["Set a goal first. Then begin.", "A plan first. Then the work.", "Which subject is first? Decide."],
    start: ["Starting now. No distractions.", "Timer's running. Eyes forward.", "Let's be thorough."],
    complete: ["Efficient. I'm impressed.", "Well done. Consistency matters.", "That was a proper session."],
  },
  threads: { unlock: "makoto", arrival: "makoto" },
};

export default manifest;
