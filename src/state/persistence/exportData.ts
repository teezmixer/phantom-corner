import { toPersisted } from "./mapping";
import { isPersisted } from "./guard";
import { freshPersisted, type Persisted } from "./schema";
import { HOME_LOCATION_ID } from "@/content/registry";
import { initialTimer } from "@/domain/timer";
import type { AppState } from "../store";

/**
 * The user's data as a JSON file (spec §4.9: export). Built from the live state so it is always current, keeping the
 * stored identity when there is one. Contains progress and preferences only — no secrets exist to leak.
 */
export function buildExport(state: AppState, storedRaw: string | null, nowIso: string): { filename: string; json: string } {
  let base: Persisted | null = null;
  try {
    const parsed: unknown = storedRaw ? JSON.parse(storedRaw) : null;
    if (isPersisted(parsed)) base = parsed;
  } catch { /* unreadable stored data: export from the live state alone */ }
  const prev = base ?? freshPersisted("export", nowIso, { timer: initialTimer, locationId: HOME_LOCATION_ID, visited: [HOME_LOCATION_ID] });
  const data = toPersisted(state, prev, nowIso);
  return { filename: `phantom-corner-${nowIso.slice(0, 10)}.json`, json: JSON.stringify(data, null, 2) };
}

/** Remove everything this app stored in the browser, backups included. Returns how many keys were removed. */
export function eraseStoredData(storage: Pick<Storage, "length" | "key" | "removeItem">, prefix = "pc:"): number {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k !== null && k.startsWith(prefix)) keys.push(k);
  }
  keys.forEach((k) => storage.removeItem(k));
  return keys.length;
}
