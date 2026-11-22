import { getLocation } from "@/content/registry";
import screenshot from "@/screenshot-2026-06-14-at-9-39-36-PM-1.png";

/**
 * Full-bleed scene behind the HUD. LeBlanc keeps the BUILT background (pre-flight P5, left untouched). Every other
 * location is a token-coloured block with its name and register (DECISION: placeholder-scenes).
 */
export function Scene({ locationId }: { locationId: string }) {
  const location = getLocation(locationId);
  if (locationId === "leblanc") {
    return <img className="absolute inset-0 h-full w-full object-cover" alt="Background scene" src={screenshot} />;
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-greydark text-center text-white" role="img" aria-label={`Scene placeholder: ${location.name}`}>
      <p className="font-display-hero text-7xl leading-none">{location.name}</p>
      <p className="font-body-primary text-lg text-greylight">{location.register}</p>
      <p className="mt-4 border border-greymid px-2 text-xs uppercase text-greylight">placeholder scene</p>
    </div>
  );
}
