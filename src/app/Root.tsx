import type { Bootstrap } from "./bootstrap";
import { App } from "./App";
import { useSessionLock } from "@/hooks/useSessionLock";
import { TabLockScreen } from "@/screens/TabLock/TabLockScreen";
import { StoreProvider } from "@/state/StoreProvider";

/** One tab owns the session; demo mode is in-memory and never takes the lock (spec §4.7). */
export function Root({ boot, dev }: { boot: Bootstrap; dev: boolean }) {
  const lock = useSessionLock(boot.persistence !== null);
  if (lock.status === "checking") return <div className="fixed inset-0 bg-black" />;
  if (lock.status === "locked") return <TabLockScreen onTakeover={lock.takeover} />;
  return (
    <StoreProvider initial={boot.initial} persistence={boot.persistence ? { ...boot.persistence, enabled: true } : undefined}>
      <App dev={dev} />
    </StoreProvider>
  );
}
