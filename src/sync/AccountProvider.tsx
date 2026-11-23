import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { settings } from "@/content/copy";
import { useStore } from "@/state/StoreProvider";
import type { StorageAdapter } from "@/state/persistence/adapter";
import { isPersisted } from "@/state/persistence/guard";
import type { Persisted } from "@/state/persistence/schema";
import { patchFromSnapshot, snapshotFromState } from "./apply";
import type { Backend } from "./backend";
import { syncOnce } from "./engine";
import type { Who } from "./types";

export interface Account {
  who: Who | null;
  /** True while the backend is the in-memory practice one. */
  fake: boolean;
  busy: boolean;
  /** A message to show, in words for the player. */
  error: string | null;
  codeSent: boolean;
  /** "down" when the last sync could not reach the server (spec §3.11: sync down). */
  sync: "idle" | "syncing" | "down";
  requestCode(email: string): Promise<void>;
  verify(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
  syncNow(): Promise<void>;
  exportAccount(): Promise<string>;
  deleteAccount(): Promise<void>;
}

const AccountContext = createContext<Account | null>(null);

/** The account, or null when accounts are off for this visit (the only way the rest of the app asks "are accounts on?"). */
// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider
export const useAccount = (): Account | null => useContext(AccountContext);

const SYNC_DELAY_MS = 2000;

/**
 * Sign-in and sync for one visit (spec §4.9). Local first: the app never waits for this and nothing here can lose local
 * progress, because a sync only adds events and takes a newer copy of three documents, and a failed one writes nothing.
 */
export function AccountProvider({ backend, adapter, base, children }: { backend: Backend; adapter: StorageAdapter; base: Persisted; children: ReactNode }) {
  const { state, dispatch } = useStore();
  const { api, fake } = backend;
  const [who, setWho] = useState<Who | null>(() => api.current());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [sync, setSync] = useState<Account["sync"]>("idle");
  const latest = useRef(state);
  useEffect(() => { latest.current = state; });
  const running = useRef(false);

  useEffect(() => { dispatch({ type: "SET_SIGNED_IN", signedIn: who !== null }); }, [who, dispatch]);

  /** The saved copy is what the saver last wrote; its stamps say when each document last changed. */
  const lastSaved = useCallback((): Persisted => {
    try { const raw = adapter.read(); const parsed: unknown = raw ? JSON.parse(raw) : null; if (isPersisted(parsed)) return parsed; } catch { /* use the copy loaded at the start */ }
    return base;
  }, [adapter, base]);

  const syncNow = useCallback(async () => {
    if (running.current || !api.current()) return;
    running.current = true;
    setSync("syncing");
    try {
      const { merged, changedLocal } = await syncOnce(api, snapshotFromState(latest.current, lastSaved(), new Date().toISOString()));
      if (changedLocal) dispatch({ type: "SYNC_APPLY", patch: patchFromSnapshot(merged) });
      setSync("idle");
      setError(null);
    } catch {
      setSync("down"); // nothing was lost: the next trigger tries again
    } finally {
      running.current = false;
    }
  }, [api, dispatch, lastSaved]);

  // Sync again when something that is synced has changed (after a short pause), when the tab comes back, and when the network does.
  useEffect(() => {
    if (!who) return;
    const t = setTimeout(() => { void syncNow(); }, SYNC_DELAY_MS);
    return () => clearTimeout(t);
  }, [who, state.events, state.mission, state.missionDone, state.missionDeadline, state.todos, syncNow]);
  useEffect(() => {
    if (!who) return;
    const visible = () => { if (document.visibilityState === "visible") void syncNow(); };
    const online = () => { void syncNow(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", online);
    return () => { document.removeEventListener("visibilitychange", visible); window.removeEventListener("online", online); };
  }, [who, syncNow]);

  const attempt = useCallback(async (run: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try { await run(); } catch (e) { setError(e instanceof Error && e.message !== "offline" ? e.message : settings.accountPanel.syncDown); } finally { setBusy(false); }
  }, []);

  const value = useMemo<Account>(() => ({
    who, fake, busy, error, codeSent, sync,
    requestCode: (email) => attempt(async () => { await api.requestCode(email); setCodeSent(true); }),
    verify: (email, code) => attempt(async () => { setWho(await api.verifyCode(email, code)); setCodeSent(false); void syncNow(); }), // signing in is the first sync: the guest's history goes up at once
    signOut: () => attempt(async () => { await api.signOut(); setWho(null); setSync("idle"); }), // local progress is never touched
    syncNow,
    exportAccount: async () => JSON.stringify(await api.exportAll(), null, 2),
    deleteAccount: () => attempt(async () => { await api.deleteAccount(); setWho(null); setSync("idle"); }),
  }), [who, fake, busy, error, codeSent, sync, api, attempt, syncNow]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}
