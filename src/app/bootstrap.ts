import { HOME_LOCATION_ID } from "@/content/registry";
import { initialTimer } from "@/domain/timer";
import type { AppState } from "@/state/store";
import type { StorageAdapter } from "@/state/persistence/adapter";
import { loadPersisted } from "@/state/persistence/load";
import { stateFromPersisted } from "@/state/persistence/mapping";
import { freshPersisted, type Persisted } from "@/state/persistence/schema";
import { buildInitialState, type UrlMode } from "./initialState";

export interface Bootstrap {
  initial: AppState;
  /** Absent in demo mode, which never reads or writes saved progress (spec §3.12). */
  persistence: { adapter: StorageAdapter; base: Persisted } | null;
}

/** Everything decided at startup, as one pure-ish function: URL mode + storage → starting state. */
export function bootstrap(mode: UrlMode, now: number, adapter: StorageAdapter, makeClientId: () => string): Bootstrap {
  if (mode.demo) return { initial: buildInitialState(mode, now), persistence: null };
  const loaded = loadPersisted(adapter, new Date(now).toISOString(), makeClientId, {
    timer: initialTimer,
    locationId: HOME_LOCATION_ID,
    visited: [HOME_LOCATION_ID],
  });
  let initial: AppState;
  let safeToWrite = loaded.safeToWrite;
  try {
    initial = stateFromPersisted(loaded.persisted, now, { recovered: loaded.recovered, storageBlocked: adapter.blocked || !loaded.safeToWrite, firstVisit: loaded.firstVisit });
  } catch {
    // Data that passed the guard but still cannot be turned into a session: treat it like unreadable data — keep a verified
    // copy, start fresh, and never overwrite the original unless the copy is safe.
    const raw = adapter.read();
    safeToWrite = raw !== null && adapter.backup(raw);
    initial = stateFromPersisted(freshPersisted(makeClientId(), new Date(now).toISOString(), { timer: initialTimer, locationId: HOME_LOCATION_ID, visited: [HOME_LOCATION_ID] }), now, { recovered: true, storageBlocked: !safeToWrite });
  }
  return {
    initial,
    // Dev mode reads saved progress but never writes it (its grants and resets are throwaway); unsafe data is left alone.
    persistence: safeToWrite && !mode.dev ? { adapter, base: loaded.persisted } : null,
  };
}
