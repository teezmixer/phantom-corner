import { useMemo } from "react";
import { useSessionLock } from "@/hooks/useSessionLock";
import { TabLockScreen } from "@/screens/TabLock/TabLockScreen";
import { localStorageAdapter } from "@/state/persistence/adapter";
import { STORAGE_KEY } from "@/state/persistence/schema";
import { StoreProvider } from "@/state/StoreProvider";
import { App } from "./App";
import { bootstrap, type Bootstrap } from "./bootstrap";
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

/**
 * Loaded once per page load. React StrictMode (dev) runs initialisers twice, which would back unreadable data up
 * twice; caching here keeps it to one read, after the lock is held.
 */
let booted: Bootstrap | undefined;
function bootOnce(mode: UrlMode): Bootstrap {
  booted ??= bootstrap(mode, Date.now(), localStorageAdapter(STORAGE_KEY), () => crypto.randomUUID());
  return booted;
}

function Session({ mode }: { mode: UrlMode }) {
  const boot = bootOnce(mode);
  const persistence = useMemo(() => (boot.persistence ? { ...boot.persistence, enabled: true } : undefined), [boot]);
  return (
    <StoreProvider initial={boot.initial} persistence={persistence}>
      <App dev={mode.dev} />
    </StoreProvider>
  );
}
