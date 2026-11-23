import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import type { LocationManifest } from "@/content/types";

// Lines are DRAFTS in voice (decision D-10) except Ares's VERBATIM lines. Place name and register: content/places.ts.
// Playlist is the shared PROVISIONAL one (content/tracks.ts, decision D-26) until per-location music is chosen.
const manifest: LocationManifest = {
  id: "yusuke",
  canonIndex: 3,
  character: "Yusuke",
  speaker: "yusuke",
  scene: {},
  playlist: PLACEHOLDER_PLAYLIST,
  ambience: [
    { id: "yusuke-room", label: "Brush on paper", synth: "room" },
    { id: "yusuke-wind", label: "Birds outside", synth: "wind" },
  ],
  lines: {
    arrive: ["Ah. The light here is ideal for concentration. Sit.", "Observe the way the light falls. Then begin.", "A fine place to work. I have looked at it for hours."],
    back: ["You return. The composition is complete.", "Ah, the model returns. I mean: the student.", "The same light, and yet a different day."],
    idle: ["Inspiration rewards the patient.", "A blank page is also a beginning.", "Do not rush the first stroke."],
    start: ["Let us both create.", "Then we begin. Silence, please.", "Eyes on the work."],
    complete: ["Exquisite discipline.", "A session worth framing.", "You have my admiration. And my appetite."],
  },
  threads: { unlock: "yusuke", arrival: "yusuke" },
};

export default manifest;
