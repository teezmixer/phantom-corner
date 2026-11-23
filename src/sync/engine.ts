import type { ProgressEvent } from "@/domain/progress";
import { plan } from "./merge";
import { Refused, type Snapshot, type SyncBackend } from "./types";

/** Sends the events in one go; if the server refuses the batch, one by one, so a single bad event cannot keep the rest from going up. */
async function pushEvents(backend: SyncBackend, events: ProgressEvent[]): Promise<void> {
  try { await backend.pushEvents(events); return; } catch (e) { if (!(e instanceof Refused)) throw e; }
  for (const event of events) {
    try { await backend.pushEvents([event]); } catch (e) { if (!(e instanceof Refused)) throw e; /* this one stays local */ }
  }
}

/**
 * One sync (spec §4.9, "on sign-in" and "afterwards" are the same code): pull what the server has, merge, push what it
 * lacks. Returns what this device should now hold. Rejects when the backend does; the caller keeps its local copy and tries
 * again later, because progress is never held back for the server. Pushing is last, so a failed pull never writes.
 */
export async function syncOnce(backend: SyncBackend, local: Snapshot): Promise<{ merged: Snapshot; changedLocal: boolean }> {
  const [remoteEvents, remoteDocs] = await Promise.all([backend.pullEvents(), backend.pullDocs()]);
  const p = plan(local, remoteEvents, remoteDocs);
  if (p.pushEvents.length > 0) await pushEvents(backend, p.pushEvents);
  if (Object.keys(p.pushDocs).length > 0) await backend.pushDocs(p.pushDocs);
  return { merged: p.merged, changedLocal: p.changedLocal };
}
