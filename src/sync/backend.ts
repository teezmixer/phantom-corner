import { FakeBackend, FakeServer } from "./fake";
import type { SyncBackend } from "./types";

/**
 * The backend the app talks to. Until the live Supabase project and its keys exist (blocked, B-10) this is the in-memory
 * fake: a "server" that lives only in this page. When keys arrive, a Supabase implementation of `SyncBackend` is returned
 * here instead when `VITE_SUPABASE_URL` is set; nothing else in the app changes.
 */
export interface Backend { api: SyncBackend; fake: boolean }

let shared: Backend | undefined;
export function backend(): Backend {
  shared ??= { api: new FakeBackend(new FakeServer()), fake: true };
  return shared;
}
