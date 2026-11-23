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
    arrive: ["Yo! Took you long enough. Pull up a chair — well, a crate.", "Man, this roof's the best spot. Don't tell anyone.", "Sit! Anywhere's fine. It's a roof!"],
    back: ["Back on the roof, huh? Nice.", "There you are! Thought you bailed.", "Roof's all yours again. Mostly."],
    idle: ["C'mon, let's knock this out.", "Ready? I'm ready. Super ready.", "Let's gooo, the timer's just sitting there."],
    start: ["Alright, sprint time!", "Heads down, no excuses!", "Okay okay okay, focusing!"],
    complete: ["Dude, that was solid!", "Whoa, you actually did the whole thing!", "Ha! Told you we could do it."],
  },
  threads: { unlock: "ryuji", arrival: "ryuji" },
};

export default manifest;
