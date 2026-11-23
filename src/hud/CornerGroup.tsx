import type React from "react";
import { REF_HEIGHT, REF_WIDTH } from "./useHudScale";

export type Corner = "tl" | "tr" | "bl" | "br";

// Where each corner group is pinned, and which point it scales from.
const CORNER_STYLES: Record<Corner, { position: string; origin: string }> = {
  tl: { position: "top-0 left-0", origin: "top left" },
  tr: { position: "top-0 right-0", origin: "top right" },
  bl: { position: "bottom-0 left-0", origin: "bottom left" },
  br: { position: "bottom-0 right-0", origin: "bottom right" },
};

// A corner group: a reference-sized box glued to one screen corner.
// Children are placed by their distance from THAT corner.
export const CornerGroup = ({
  corner,
  scale,
  label,
  children,
}: {
  corner: Corner;
  scale: number;
  label: string;
  children: React.ReactNode;
}): React.JSX.Element => (
  <section
    aria-label={label}
    className={`hud-group absolute ${CORNER_STYLES[corner].position} pointer-events-none`}
    style={{
      width: REF_WIDTH,
      height: REF_HEIGHT,
      transform: `scale(${scale})`,
      ["--hud-scale" as string]: scale,
      transformOrigin: CORNER_STYLES[corner].origin,
    }}
  >
    {children}
  </section>
);
