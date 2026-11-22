import { useCallback, useEffect, useState } from "react";

const LOCK_NAME = "pc:session";
/** How long to wait for a previous page's lock to clear before declaring "another tab" (a reload must not lose to itself). */
const WAIT_MS = 600;
const TAKEOVER_FLAG = "pc:takeover";

export type LockStatus = "checking" | "owner" | "locked";

/**
 * One tab owns the session (spec §4.7). A Web Lock is held for the life of the page; a second tab finds it taken and
 * shows the takeover screen. Taking over steals the lock and reloads so the new owner starts from what the old one saved.
 * Where Web Locks do not exist, every tab counts as owner (heartbeat fallback is not built; see ADR 0006).
 */
export function useSessionLock(enabled: boolean): { status: LockStatus; takeover: () => void } {
  // Without Web Locks (or when disabled) every tab is the owner from the first render, so no state is set in the effect.
  const lockable = enabled && typeof navigator !== "undefined" && !!navigator.locks;
  const [status, setStatus] = useState<LockStatus>(lockable ? "checking" : "owner");

  useEffect(() => {
    if (!lockable) return;
    let alive = true;
    let release: (() => void) | undefined;
    const steal = readAndClearTakeoverFlag();
    const controller = new AbortController();
    const timeout = steal ? undefined : setTimeout(() => controller.abort(), WAIT_MS);
    const options: LockOptions = steal ? { steal: true } : { signal: controller.signal };
    navigator.locks
      .request(LOCK_NAME, options, () => {
        if (timeout) clearTimeout(timeout);
        if (alive) setStatus("owner");
        return new Promise<void>((resolve) => { release = resolve; });
      })
      // Rejects when we time out waiting, or when another tab steals the lock from us.
      .catch(() => { if (alive) setStatus("locked"); });
    return () => {
      alive = false;
      if (timeout) clearTimeout(timeout);
      controller.abort();
      release?.();
    };
  }, [lockable]);

  const takeover = useCallback(() => {
    try { window.sessionStorage.setItem(TAKEOVER_FLAG, "1"); } catch { /* the reload will simply wait for the lock */ }
    window.location.reload();
  }, []);

  return { status, takeover };
}

function readAndClearTakeoverFlag(): boolean {
  try {
    const flagged = window.sessionStorage.getItem(TAKEOVER_FLAG) === "1";
    if (flagged) window.sessionStorage.removeItem(TAKEOVER_FLAG);
    return flagged;
  } catch {
    return false;
  }
}
