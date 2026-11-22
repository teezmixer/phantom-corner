import { useState } from "react";
import { useSessionLock } from "@/hooks/useSessionLock";
import { TabLockScreen } from "@/screens/TabLock/TabLockScreen";
import { localStorageAdapter } from "@/state/persistence/adapter";
import { STORAGE_KEY } from "@/state/persistence/schema";
import { StoreProvider } from "@/state/StoreProvider";
import { App } from "./App";
import { bootstrap } from "./bootstrap";
import type { UrlMode } from "./initialState";

/**
 * One tab owns the session (spec §4.7). Saved data is read only AFTER the lock is held, inside <Session>, so a tab
 * that had to wait can never start from a copy that the previous owner then overwrites. Demo and dev modes are
 * in-memory and never take the lock.
 */
export function Root({ mode }: { mode: UrlMode }) {
  const lock = useSessionLock(!mode.demo && !mode.dev);
  if (lock.status === "checking") return <div className="fixed inset-0 bg-black" />;
  if (lock.status === "locked") return <TabLockScreen onTakeover={lock.takeover} />;
  return <Session mode={mode} />;
}

function Session({ mode }: { mode: UrlMode }) {
  const [boot] = useState(() => bootstrap(mode, Date.now(), localStorageAdapter(STORAGE_KEY), () => crypto.randomUUID()));
  return (
    <StoreProvider initial={boot.initial} persistence={boot.persistence ? { ...boot.persistence, enabled: true } : undefined}>
      <App dev={mode.dev} />
    </StoreProvider>
  );
}
