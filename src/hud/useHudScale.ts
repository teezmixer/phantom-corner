import { useEffect, useState } from "react";

// The HUD is designed on a 1440x900 reference screen, then scaled to the real screen.
export const REF_WIDTH = 1440;
export const REF_HEIGHT = 900;
// Widgets are exported at 3x, so past 3x they would be upscaled and go soft.
export const MAX_HUD_SCALE = 3;

// How much to grow/shrink the HUD so it always fits inside the user's screen.
export function useHudScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(
        Math.min(
          MAX_HUD_SCALE,
          window.innerWidth / REF_WIDTH,
          window.innerHeight / REF_HEIGHT
        )
      );
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return scale;
}
