import type { StorageAdapter } from "./adapter";
import { isPersisted } from "./guard";
import { migrate } from "./migrate";
import { freshPersisted, type Persisted } from "./schema";

export interface LoadResult {
  persisted: Persisted;
  /** True when stored data existed but could not be used, so this visit starts fresh (spec §3.11). */
  recovered: boolean;
  /** True when this is the user's first ever visit (nothing stored). */
  firstVisit: boolean;
}

/**
 * Load path (spec §4.7): read → JSON.parse in a try → migrate → guard → use. Any failure backs up the raw string
 * and starts fresh with `recovered` set, so unreadable data is never silently destroyed.
 */
export function loadPersisted(
  adapter: StorageAdapter,
  nowIso: string,
  makeClientId: () => string,
  defaults: Pick<Persisted, "timer" | "locationId" | "visited">,
): LoadResult {
  const fresh = () => freshPersisted(makeClientId(), nowIso, defaults);
  const raw = adapter.read();
  if (raw === null) return { persisted: fresh(), recovered: false, firstVisit: true };
  try {
    const migrated = migrate(JSON.parse(raw));
    if (!isPersisted(migrated)) throw new Error("stored data has the wrong shape");
    return { persisted: migrated, recovered: false, firstVisit: false };
  } catch {
    adapter.backup(raw);
    return { persisted: fresh(), recovered: true, firstVisit: false };
  }
}
