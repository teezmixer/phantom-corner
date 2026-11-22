/** Where the raw string lives. The real one is localStorage; tests and demo mode use memory (spec §4.7). */
export interface StorageAdapter {
  read(): string | null;
  write(raw: string): void;
  /** Keep a copy of data we could not use, so nothing is destroyed silently. */
  backup(raw: string): void;
  /** True when the browser would not let us store anything (private mode, blocked site data). */
  readonly blocked: boolean;
}

export function memoryAdapter(seed: string | null = null): StorageAdapter & { dump(): { raw: string | null; backups: string[] } } {
  let raw = seed;
  const backups: string[] = [];
  return {
    blocked: false,
    read: () => raw,
    write: (next) => { raw = next; },
    backup: (old) => { backups.push(old); },
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
  const guard = <T>(fn: () => T, orElse: T): T => {
    try { return fn(); } catch { blocked = true; return orElse; }
  };
  // Probe once so `blocked` is known before the first render.
  guard(() => { window.localStorage.getItem(key); }, undefined);
  return {
    get blocked() { return blocked; },
    read: () => guard(() => window.localStorage.getItem(key), fallback),
    write: (raw) => { fallback = raw; guard(() => window.localStorage.setItem(key, raw), undefined); },
    backup: (raw) => { guard(() => window.localStorage.setItem(`${key}:backup:${new Date(now()).toISOString()}`, raw), undefined); },
  };
}
