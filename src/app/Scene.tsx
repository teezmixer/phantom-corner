import { getLocation } from "@/content/registry";
import { dayPartAt } from "@/domain/daynight";
import { useNow } from "@/hooks/useNow";
import screenshot from "@/screenshot-2026-06-14-at-9-39-36-PM-1.png";

/**
 * Full-bleed scene behind the HUD. LeBlanc keeps the BUILT background (pre-flight P5, left untouched). Every other
 * location is a token-coloured block with its name and register (DECISION: placeholder-scenes).
 *
 * Each place has a day and a night variant chosen from the player's clock (spec §3.3), re-checked every minute. A place
 * with night art (`scene.night`) shows it after dark; until that art exists, the night variant is the same picture with
 * `data-variant="night"` on it (and, for the placeholder blocks, a darker token colour and the word "night").
 * DECISION: D-36 — the hours and the placeholder look of the night variant are Ares's call.
 */
export function Scene({ locationId }: { locationId: string }) {
  const location = getLocation(locationId);
  const variant = dayPartAt(useNow(60_000));
  if (locationId === "leblanc") {
    const night = variant === "night" ? location.scene.night : undefined;
    return <img data-variant={variant} className="absolute inset-0 h-full w-full object-cover" alt="Background scene" src={night?.src ?? screenshot} />;
  }
  return (
    <div data-variant={variant} className={`absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white ${variant === "night" ? "bg-black" : "bg-greydark"}`} role="img" aria-label={`Scene placeholder: ${location.name}, ${variant}`}>
      <p className="font-display-hero text-7xl leading-none">{location.name}</p>
      <p className="font-body-primary text-lg text-greylight">{location.register}</p>
      <p className="mt-4 border border-greymid px-2 text-xs uppercase text-greylight">placeholder scene · {variant}</p>
    </div>
  );
}
