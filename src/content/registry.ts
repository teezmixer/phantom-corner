import type { LocationManifest } from "./types";
import { PLACES, type Place } from "./places";
import { BONUS_UNLOCK_LEVELS, UNLOCK_LEVELS } from "./progression";

/**
 * Location registry built from the folder: every content/locations/<id>/manifest.ts is a location.
 * Adding a location is a content task — no list to edit (spec §4.6).
 */
const modules = import.meta.glob<{ default: LocationManifest }>("./locations/*/manifest.ts", { eager: true });

export type Location = LocationManifest & Place & { unlockLevel: number; bonus: boolean };

function build(m: LocationManifest): Location {
  const place = PLACES[m.id];
  if (!place) throw new Error(`content/places.ts has no entry for location "${m.id}"`);
  const bonus = m.canonIndex === null;
  const unlockLevel = bonus ? BONUS_UNLOCK_LEVELS[m.id] : UNLOCK_LEVELS[m.id];
  if (unlockLevel === undefined) throw new Error(`content/progression.ts has no unlock level for "${m.id}"`);
  return { ...m, ...place, unlockLevel, bonus };
}

/** All locations: canon in join order, then bonus locations by unlock level. */
export const LOCATIONS: readonly Location[] = Object.values(modules)
  .map((mod) => build(mod.default))
  .sort((a, b) => (a.canonIndex ?? 100 + a.unlockLevel) - (b.canonIndex ?? 100 + b.unlockLevel));

const BY_ID = new Map(LOCATIONS.map((l) => [l.id, l]));

export function getLocation(id: string): Location {
  const loc = BY_ID.get(id);
  if (!loc) throw new Error(`Unknown location "${id}"`);
  return loc;
}

export const HOME_LOCATION_ID = "leblanc";
