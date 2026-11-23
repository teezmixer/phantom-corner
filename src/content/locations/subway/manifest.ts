import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "subway",
  canonIndex: null,
  character: null,
  speaker: "morgana",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "subway-hum", label: "Rails", synth: "hum" },
    { id: "subway-murmur", label: "Announcements", synth: "murmur" },
  ],
  lines: {
    arrive: ["Last train. Find a seat before it fills up.", "Mind the gap. Mind the schedule.", "Late night, empty carriage. Use it."],
    back: ["Same carriage as always.", "The five-minute delay is yours now.", "Hold the strap. Hold the thought."],
    idle: ["Three stops to go. Use them.", "Next stop is your deadline.", "The tunnel's long. So's your list."],
    start: ["Doors closing. Go.", "Departing. No distractions on this line.", "All aboard the focus express."],
    complete: ["Our stop. Nicely done.", "Arrived. Early, even.", "That's the end of the line. For today."],
  },
  threads: {  },
};

export default manifest;
