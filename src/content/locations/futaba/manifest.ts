import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "futaba",
  canonIndex: 5,
  character: "Futaba",
  speaker: "futaba",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "futaba-hum", label: "Computer fans", synth: "hum" },
    { id: "futaba-city", label: "Muffled city", synth: "city" },
  ],
  lines: {
    arrive: ["oh. you're actually here. don't touch the cables.", "welcome to my room. it's not messy. it's organised chaos.", "you can sit. the chair's fine. probably."],
    back: ["you again. ok. that's fine. good, even.", "oh good. someone to share the snacks with.", "you showed up. noted. don't make it weird."],
    idle: ["compiling... your motivation.", "scanning for distractions... found: you.", "boot sequence takes a second. like me."],
    start: ["entering flow state. do not disturb.", "ok. focus. i'll pretend i'm not watching.", "starting timer. no peeking at my screen."],
    complete: ["nice run. don't tell anyone i was impressed.", "gg. that was actually kind of cool.", "achievement unlocked: not giving up. don't let it go to your head."],
  },
  threads: { unlock: "futaba", arrival: "futaba" },
};

export default manifest;
