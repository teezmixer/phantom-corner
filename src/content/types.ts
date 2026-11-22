import type { Corner } from "@/hud/CornerGroup";
import type { SlotMap } from "@/hud/slots";

/** A picture that ships with the app. `alt` is required (spec §4.12). */
export interface ImageRef {
  src: string;
  width: number;
  height: number;
  alt: string;
}

/** A YouTube track. Ids must be rights-holder uploads (spec §4.8). */
export interface TrackRef {
  videoId: string;
  title: string;
  source: "rights-holder" | "user";
  checkedOn: string;
}

/** Placeholder ambience is synthesised with Web Audio until licensed files exist (decision D-13). */
export type AmbienceSynth = "rain" | "murmur" | "wind" | "room" | "city" | "hum";
export interface AmbienceRef {
  id: string;
  label: string;
  synth: AmbienceSynth;
}

export interface LocationLines {
  /** First time the user arrives here. */
  arrive: string[];
  /** Returning to this location. */
  back: string[];
  /** Said while the user idles before starting. */
  idle: string[];
  /** Said when a session starts. */
  start: string[];
  /** Said when a session completes (summary). */
  complete: string[];
}

/** One location's content (spec §4.6). Adding a folder under content/locations adds a location. */
export interface LocationManifest {
  id: string;
  /** 0–7 in canon join order; null for bonus locations. */
  canonIndex: number | null;
  /** Who is here, as shown in copy. */
  character: string | null;
  /** The speaker id used for this location's lines (see content/copy). */
  speaker: string;
  scene: { poster?: ImageRef; night?: ImageRef };
  /** Hand-drawn sign. Absent → the place name in the display face (spec §3.6). */
  sign?: ImageRef;
  /** Where the TV sits in this room, in real CSS px from a screen corner. Absent → default (D-05). */
  tv?: { corner: Corner; x: number; y: number };
  playlist: TrackRef[];
  ambience: AmbienceRef[];
  hud?: Partial<SlotMap>;
  lines: LocationLines;
  threads: { unlock?: string; arrival?: string };
}
