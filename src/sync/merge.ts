import type { ProgressEvent } from "@/domain/progress";
import type { Doc, Docs, Snapshot } from "./types";

/**
 * Union of two event logs by id (spec §4.9). This device's order is kept; events only the other side has follow, in their
 * order. An event with no id is kept as it is (it can only be in memory-only modes, which never sync). Two devices that both
 * recorded `mission_first_set` give two events; the Knowledge fold counts that kind once.
 */
export function mergeEvents(local: readonly ProgressEvent[], remote: readonly ProgressEvent[]): ProgressEvent[] {
  const seen = new Set(local.flatMap((e) => (e.id ? [e.id] : [])));
  const added = remote.filter((e) => {
    if (!e.id || seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  return added.length === 0 ? [...local] : [...local, ...added];
}

/** The newer copy of a document. On a tie, or when the other side has none, this device's copy stays. */
export function newer<T>(local: Doc<T>, remote: Doc<T> | undefined): Doc<T> {
  return remote && remote.updatedAt > local.updatedAt ? remote : local;
}

export interface Plan {
  /** What this device should hold after the sync. */
  merged: Snapshot;
  /** Events the server lacks. */
  pushEvents: ProgressEvent[];
  /** Documents where this device's copy is the newer one. */
  pushDocs: Docs;
  /** True when anything of the server's changed this device's copy. */
  changedLocal: boolean;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Works out the whole sync as plain data, so the rules can be tested without a backend: nothing here talks to anything. */
export function plan(local: Snapshot, remoteEvents: readonly ProgressEvent[], remoteDocs: Docs): Plan {
  const events = mergeEvents(local.events, remoteEvents);
  const remoteIds = new Set(remoteEvents.flatMap((e) => (e.id ? [e.id] : [])));
  // The developer panel's grants are throwaway and never leave the device (the server refuses them too).
  const pushEvents = local.events.filter((e) => e.id && e.kind !== "dev_grant" && !remoteIds.has(e.id));
  const settings = newer(local.docs.settings, remoteDocs.settings);
  const mission = newer(local.docs.mission, remoteDocs.mission);
  const todos = newer(local.docs.todos, remoteDocs.todos);
  const pushDocs: Docs = {};
  // Equal data is not pushed, so two devices that agree do not keep re-stamping each other.
  if (settings === local.docs.settings && !same(settings.data, remoteDocs.settings?.data)) pushDocs.settings = settings;
  if (mission === local.docs.mission && !same(mission.data, remoteDocs.mission?.data)) pushDocs.mission = mission;
  if (todos === local.docs.todos && !same(todos.data, remoteDocs.todos?.data)) pushDocs.todos = todos;
  const changedLocal = events.length !== local.events.length || settings !== local.docs.settings || mission !== local.docs.mission || todos !== local.docs.todos;
  return { merged: { events, docs: { settings, mission, todos } }, pushEvents, pushDocs, changedLocal };
}
