import { plan } from "./merge";
import type { Snapshot, SyncBackend } from "./types";

/**
 * One sync (spec §4.9, "on sign-in" and "afterwards" are the same code): pull what the server has, merge, push what it
 * lacks. Returns what this device should now hold. Rejects when the backend does; the caller keeps its local copy and tries
 * again later, because progress is never held back for the server. Pushing is last, so a failed pull never writes.
 */
export async function syncOnce(backend: SyncBackend, local: Snapshot): Promise<{ merged: Snapshot; changedLocal: boolean }> {
  const [remoteEvents, remoteDocs] = await Promise.all([backend.pullEvents(), backend.pullDocs()]);
  const p = plan(local, remoteEvents, remoteDocs);
  if (p.pushEvents.length > 0) await backend.pushEvents(p.pushEvents);
  if (Object.keys(p.pushDocs).length > 0) await backend.pushDocs(p.pushDocs);
  return { merged: p.merged, changedLocal: p.changedLocal };
}
