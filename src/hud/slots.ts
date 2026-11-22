import type React from "react";
import type { Corner } from "./CornerGroup";

/** Every widget that has a place on the HUD (spec §4.4). */
export type WidgetId =
  | "date"
  | "timer"
  | "phone"
  | "mission"
  | "todo"
  | "level"
  | "buttonBar"
  | "music"
  | "location";

/**
 * A widget's box in the 1440x900 reference frame, measured from ITS corner:
 * `x` is the distance from the corner's vertical edge (left for tl/bl, right for tr/br),
 * `y` from its horizontal edge (top for tl/tr, bottom for bl/br).
 */
export type Slot = { corner: Corner; x: number; y: number; w: number; h: number };
export type SlotMap = Record<WidgetId, Slot>;

/**
 * Default slot map. Positions are the BUILT offsets from the original MainScreen (spec §3.6 BUILT),
 * which tune the Figma "Group 5" slots (docs/build/figma-main-screen.md). `phone` has no BUILT
 * position and comes straight from Figma node 28:68. Differences from Figma: decision D-20.
 */
export const DEFAULT_SLOTS: SlotMap = {
  date: { corner: "tl", x: 39, y: 58, w: 251, h: 164 },
  timer: { corner: "tl", x: 39, y: 255, w: 204, h: 66 },
  phone: { corner: "tl", x: 44, y: 342, w: 65, h: 60 },
  mission: { corner: "tr", x: 46, y: 43, w: 272, h: 101 },
  todo: { corner: "tr", x: 46, y: 177, w: 272, h: 101 },
  level: { corner: "bl", x: 39, y: 90, w: 158, h: 116 },
  buttonBar: { corner: "bl", x: 39, y: 40, w: 233, h: 48 },
  music: { corner: "br", x: 39, y: 275, w: 213, h: 50 },
  location: { corner: "br", x: 39, y: 49, w: 484, h: 218 },
};

/** CSS for placing a slot inside its corner group. */
export function slotStyle(slot: Slot): React.CSSProperties {
  const horizontal = slot.corner === "tl" || slot.corner === "bl" ? "left" : "right";
  const vertical = slot.corner === "tl" || slot.corner === "tr" ? "top" : "bottom";
  return { position: "absolute", [horizontal]: slot.x, [vertical]: slot.y, width: slot.w, height: slot.h };
}
