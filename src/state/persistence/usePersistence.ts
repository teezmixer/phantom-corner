import { useCallback, useEffect, useMemo, useRef } from "react";
import type { AppState } from "../store";
import type { StorageAdapter } from "./adapter";
import { eraseStoredData } from "./exportData";
import { toPersisted } from "./mapping";
import type { Persisted } from "./schema";
import { createSaver } from "./saver";

export interface PersistenceConfig {
  adapter: StorageAdapter;
  /** What was loaded at the start of the visit: supplies clientId and the last-changed stamps. */
  base: Persisted;
  /** False in demo mode and while another tab owns the session: nothing is written. */
  enabled: boolean;
}

/**
 * Save the store to storage: debounced on change, flushed when the tab is hidden or the page closes (spec §4.7).
 * Returns `wipe()`: cancel anything pending, erase everything this app stored, and reload to a true first visit.
 * A visit where nothing has changed is never written, so someone who only looks at the splash leaves nothing behind.
 */
export function usePersistence(state: AppState, config: PersistenceConfig | undefined, onWriteFailed?: () => void): { wipe: () => void } {
  // `config` and `onWriteFailed` must be stable (memoised by the caller) so the saver is created once.
  const saver = useMemo(() => (config ? createSaver(config.adapter, 250, onWriteFailed) : null), [config, onWriteFailed]);
  const last = useRef<Persisted | null>(config?.base ?? null);
  const startState = useRef(state);
  const wiped = useRef(false);

  useEffect(() => {
    if (!config || !saver || !last.current || wiped.current) return;
    if (!config.enabled) { saver.cancel(); return; }
    if (state === startState.current) return; // nothing has changed since the page loaded: nothing to save
    const next = toPersisted(state, last.current, new Date().toISOString());
    last.current = next;
    saver.save(next);
  }, [state, config, saver]);

  useEffect(() => {
    if (!saver) return;
    const onHide = () => { if (document.visibilityState === "hidden") saver.flush(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", saver.flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", saver.flush);
      // Cancel, not flush: an unmount here can mean this tab lost the session lock, and it must not overwrite the new owner.
      saver.cancel();
    };
  }, [saver]);

  const wipe = useCallback(() => {
    wiped.current = true; // no later state change may write the old save back
    saver?.cancel(); // …and nothing already queued may either
    try { eraseStoredData(window.localStorage); } catch { /* storage blocked: nothing stored to remove */ }
    window.location.reload();
  }, [saver]);

  return { wipe };
}
