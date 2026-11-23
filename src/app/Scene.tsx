import { getLocation } from "@/content/registry";
import { dayPartAt } from "@/domain/daynight";
import { useNow } from "@/hooks/useNow";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import loop from "@/bu1weaikjewy.mp4";

/**
 * Full-bleed scene behind the HUD. LeBlanc plays a short silent loop (a PLACEHOLDER the owner supplied, D-37; it replaces the
 * borrowed screenshot, which is no longer shipped, B-05). With reduced motion the loop does not play: it shows its first frame.
 * Every other location is a token-coloured block with its name and register (DECISION: placeholder-scenes).
 *
 * Each place has a day and a night variant chosen from the player's clock (spec §3.3), re-checked every minute. A place
 * with night art (`scene.night`) shows it after dark; until that art exists, the night variant is the same picture with
 * `data-variant="night"` on it (and, for the placeholder blocks, a darker token colour and the word "night").
 * DECISION: D-36 — the hours and the placeholder look of the night variant are Ares's call.
 */
export function Scene({ locationId }: { locationId: string }) {
  const location = getLocation(locationId);
  const variant = dayPartAt(useNow(60_000));
  const reduced = useReducedMotion();
  // `autoPlay` only decides how the video starts. Turning reduced motion on while it plays must stop it, and off must start it again.
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (reduced) el.pause();
    else void el.play?.()?.catch(() => { /* the browser would not start it by itself: it stays on its first frame */ });
  }, [reduced, locationId]);
  if (locationId === "leblanc") {
    // Silent (so browsers let it start by itself), looped, and only a picture to a screen reader: the room's sounds are the TV's.
    return (
      // A solid token colour behind the video: where the browser cannot play it, the room is black, not blank.
      <div data-variant={variant} role="img" aria-label="Background scene" className="absolute inset-0 bg-black">
        <video ref={video} className="h-full w-full object-cover" aria-hidden="true" src={loop} autoPlay={!reduced} loop muted playsInline preload="auto" />
      </div>
    );
  }
  return (
    <div data-variant={variant} className={`absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white ${variant === "night" ? "bg-black" : "bg-greydark"}`} role="img" aria-label={`Scene placeholder: ${location.name}, ${variant}`}>
      <p className="font-display-hero text-7xl leading-none">{location.name}</p>
      <p className="font-body-primary text-lg text-greylight">{location.register}</p>
      <p className="mt-4 border border-greymid px-2 text-xs uppercase text-greylight">placeholder scene · {variant}</p>
    </div>
  );
}
