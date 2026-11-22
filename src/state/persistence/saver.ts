import type { StorageAdapter } from "./adapter";
import type { Persisted } from "./schema";

export interface Saver {
  /** Queue a write; only the latest value is written once the debounce settles. */
  save(data: Persisted): void;
  /** Write any queued value now (tab hidden, page closing). */
  flush(): void;
  cancel(): void;
}

/** Debounced writes (~250 ms), flushed on `visibilitychange` and `pagehide` by the caller (spec §4.7). */
export function createSaver(adapter: StorageAdapter, debounceMs = 250, onFailure?: () => void): Saver {
  let pending: Persisted | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    if (pending) {
      const ok = adapter.write(JSON.stringify(pending));
      pending = null;
      if (!ok) onFailure?.();
    }
  };
  return {
    save(data) {
      pending = data;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, debounceMs);
    },
    flush,
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}
