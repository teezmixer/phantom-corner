/** Where the raw string lives. The real one is localStorage; tests and demo mode use memory (spec §4.7). */
export interface StorageAdapter {
  read(): string | null;
  /** Returns false when the write did not reach storage (blocked, quota). */
  write(raw: string): boolean;
  /** Keep a copy of data we could not use. Returns true only if the copy was written AND reads back identical. */
  backup(raw: string): boolean;
  /** True when the browser would not let us store anything (private mode, blocked site data). */
  readonly blocked: boolean;
}

/** At most this many dated backups are kept, so repeated recoveries cannot fill the quota. */
export const MAX_BACKUPS = 5;

export function memoryAdapter(seed: string | null = null): StorageAdapter & { dump(): { raw: string | null; backups: string[] } } {
  let raw = seed;
  const backups: string[] = [];
  return {
    blocked: false,
    read: () => raw,
    write: (next) => { raw = next; return true; },
    backup: (old) => { backups.push(old); return true; },
    dump: () => ({ raw, backups }),
  };
}

/**
 * localStorage, defensively: every access can throw (blocked site data, quota, private windows). When it does the
 * app keeps working for this visit from memory, and `blocked` lets Morgana say so (spec §3.11).
 */
export function localStorageAdapter(key: string, now: () => number = Date.now): StorageAdapter {
  let blocked = false;
  let fallback: string | null = null;
  const attempt = <T>(fn: () => T, orElse: T): T => {
    try { return fn(); } catch { blocked = true; return orElse; }
  };
  const backupPrefix = `${key}:backup:`;
  // Probe once so `blocked` is known before the first render.
  attempt(() => { window.localStorage.getItem(key); }, undefined);
  return {
    get blocked() { return blocked; },
    read: () => attempt(() => window.localStorage.getItem(key), fallback),
    write: (raw) => {
      fallback = raw;
      return attempt(() => { window.localStorage.setItem(key, raw); return true; }, false);
    },
    backup: (raw) => {
      // Reloading at the splash with unreadable data must not add an identical backup every time (that would rotate real ones out).
      const newest = attempt(() => Object.keys(window.localStorage).filter((k) => k.startsWith(backupPrefix)).sort().pop(), undefined);
      if (newest !== undefined && attempt(() => window.localStorage.getItem(newest) === raw, false)) return true;
      const backupKey = `${backupPrefix}${new Date(now()).toISOString()}`;
      const ok = attempt(() => { window.localStorage.setItem(backupKey, raw); return window.localStorage.getItem(backupKey) === raw; }, false);
      if (ok) {
        // Keep only the newest MAX_BACKUPS (ISO timestamps sort in time order).
        attempt(() => {
          const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(backupPrefix)).sort();
          keys.slice(0, Math.max(0, keys.length - MAX_BACKUPS)).forEach((k) => window.localStorage.removeItem(k));
        }, undefined);
      }
      return ok;
    },
  };
}
