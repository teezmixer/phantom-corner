import { lazy, Suspense, useEffect, useMemo } from "react";
import { MotionConfig } from "motion/react";
import { useStore } from "@/state/StoreProvider";
import { useAnalyticsEvents } from "./useAnalyticsEvents";
import { readOptOut, rememberOptOut, setAnalyticsAllowed } from "./telemetry";
import { useSessionLock } from "@/hooks/useSessionLock";
import { TabLockScreen } from "@/screens/TabLock/TabLockScreen";
import { localStorageAdapter } from "@/state/persistence/adapter";
import { STORAGE_KEY } from "@/state/persistence/schema";
import { StoreProvider } from "@/state/StoreProvider";
import { AudioProvider } from "@/audio/AudioProvider";
import { App } from "./App";
import { bootstrap, type Bootstrap } from "./bootstrap";
import type { UrlMode } from "./initialState";

// Sync and sign-in are only loaded when accounts are switched on, so everyone else never downloads them.
const VercelScripts = lazy(() => import("./VercelScripts"));
const CommunityProvider = lazy(() => import("@/community/CommunityProvider"));
const AccountsRoot = lazy(() => import("@/sync/AccountsRoot"));

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
  booted ??= bootstrap(mode, Date.now(), localStorageAdapter(STORAGE_KEY), () => crypto.randomUUID(), readOptOut());
  return booted;
}

function Session({ mode }: { mode: UrlMode }) {
  const boot = bootOnce(mode);
  const persistence = useMemo(() => (boot.persistence ? { ...boot.persistence, enabled: true } : undefined), [boot]);
  return (
    <StoreProvider initial={boot.initial} persistence={persistence}>
      <Preferences events={!mode.dev}>
        <AudioProvider>
          <WithCommunity on={boot.initial.communityEnabled}>
            {boot.initial.accountsEnabled && boot.persistence ? (
              <Suspense fallback={null}><AccountsRoot adapter={boot.persistence.adapter} base={boot.persistence.base}><App dev={mode.dev} /></AccountsRoot></Suspense>
            ) : (
              <App dev={mode.dev} />
            )}
          </WithCommunity>
        </AudioProvider>
      </Preferences>
    </StoreProvider>
  );
}

/** The presence count and the vote, loaded only when ?community=true. */
function WithCommunity({ on, children }: { on: boolean; children: React.ReactNode }) {
  return on ? <Suspense fallback={null}><CommunityProvider>{children}</CommunityProvider></Suspense> : <>{children}</>;
}

/**
 * Applies the saved preferences that live outside any one screen: the motion override (for animation libraries and for
 * CSS) and the analytics switch. Analytics scripts load only while the switch is on; turning it off stops them the next
 * time the page loads (a loaded script cannot be unloaded).
 */
function Preferences({ children, events }: { children: React.ReactNode; events: boolean }) {
  const { state } = useStore();
  useAnalyticsEvents(events); // the named analytics events (spec §4.16), sent only while the switch is on
  const reduced = state.motion === "reduced";
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "system";
  }, [reduced]);
  // The send-time gate and the remembered opt-out follow the switch.
  useEffect(() => {
    setAnalyticsAllowed(state.analytics && events); // developer mode sends nothing at all, including the TV's events
    if (!state.demo) rememberOptOut(!state.analytics); // a demo visit never changes the real visitor's remembered choice
  }, [state.analytics, state.demo, events]);
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      {children}
      {state.analytics && <Suspense fallback={null}><VercelScripts /></Suspense>}
    </MotionConfig>
  );
}
