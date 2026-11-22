import type { StorageAdapter } from "./adapter";
import { isPersisted } from "./guard";
import { migrate, NewerSchemaError } from "./migrate";
import { freshPersisted, type Persisted } from "./schema";

export interface LoadResult {
  persisted: Persisted;
  /** True when stored data existed but could not be used, so this visit starts fresh (spec §3.11). */
  recovered: boolean;
  /** True when this is the user's first ever visit (nothing stored). */
  firstVisit: boolean;
  /**
   * False when writing the main key would destroy something we could not keep safe: data from a newer build, or
   * unreadable data whose backup did not verify. The visit then runs from memory only and the stored copy is left alone.
   */
  safeToWrite: boolean;
}

/**
 * Load path (spec §4.7): read → JSON.parse in a try → migrate → guard → use. Any failure backs up the raw string
 * (verified by reading it back) and starts fresh with `recovered` set, so unreadable data is never silently destroyed.
 */
export function loadPersisted(
  adapter: StorageAdapter,
  nowIso: string,
  makeClientId: () => string,
  defaults: Pick<Persisted, "timer" | "locationId" | "visited">,
): LoadResult {
  const fresh = () => freshPersisted(makeClientId(), nowIso, defaults);
  const raw = adapter.read();
  if (raw === null) return { persisted: fresh(), recovered: false, firstVisit: true, safeToWrite: true };
  try {
    const migrated = migrate(JSON.parse(raw));
    if (!isPersisted(migrated)) throw new Error("stored data has the wrong shape");
    return { persisted: migrated, recovered: false, firstVisit: false, safeToWrite: true };
  } catch (error) {
    const backedUp = adapter.backup(raw);
    // Newer-build data is never replaced (an older build must not destroy it); otherwise only replace once the copy is safe.
    const safeToWrite = backedUp && !(error instanceof NewerSchemaError);
    return { persisted: fresh(), recovered: true, firstVisit: false, safeToWrite };
  }
}
