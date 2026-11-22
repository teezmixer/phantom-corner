import { useEffect, useMemo, useRef } from "react";
import type { AppState } from "../store";
import type { StorageAdapter } from "./adapter";
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

/** Save the store to storage: debounced on change, flushed when the tab is hidden or the page closes (spec §4.7). */
export function usePersistence(state: AppState, config: PersistenceConfig | undefined, onWriteFailed?: () => void): void {
  // `config` and `onWriteFailed` must be stable (memoised by the caller) so the saver is created once.
  const saver = useMemo(() => (config ? createSaver(config.adapter, 250, onWriteFailed) : null), [config, onWriteFailed]);
  const last = useRef<Persisted | null>(config?.base ?? null);

  useEffect(() => {
    if (!config || !saver || !last.current) return;
    if (!config.enabled) { saver.cancel(); return; }
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
}
