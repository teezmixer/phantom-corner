import { clampText, MAX_EVENTS } from "@/domain/limits";
import { isEvent } from "@/state/persistence/guard";
import { repairDeadline, repairSettings } from "@/state/persistence/repair";
import { repairTodos, toPersisted } from "@/state/persistence/mapping";
import type { Persisted } from "@/state/persistence/schema";
import { syncGroups, type AppState, type SyncPatch } from "@/state/store";
import type { Snapshot } from "./types";

/**
 * What of the current state is synced, with the time each document last changed (the same stamps the saver writes).
 * The analytics choice is left out of the settings document: consent is per device and never travels.
 */
export function snapshotFromState(state: AppState, base: Persisted, nowIso: string): Snapshot {
  const p = toPersisted(state, base, nowIso);
  const { analytics: _consentStaysHere, ...settings } = p.settings;
  void _consentStaysHere;
  return {
    events: p.events,
    docs: {
      settings: { data: settings, updatedAt: p.stamps.settings },
      mission: { data: p.mission, updatedAt: p.stamps.mission },
      todos: { data: { todos: p.todos, nextTodoId: p.nextTodoId }, updatedAt: p.stamps.todos },
    },
  };
}

/** The comparable form of the synced documents as they are in `state` now: what a later `SYNC_APPLY` checks against. */
export const basisOf = (state: AppState) => syncGroups(state);

/**
 * A merged snapshot as the state fields it sets. Everything from the server goes through the same repair functions as a
 * save read from storage, so a bad or hostile document cannot put impossible values into the state.
 */
export function patchFromSnapshot(s: Snapshot): SyncPatch {
  const settings = repairSettings({ ...s.docs.settings.data, analytics: true }); // analytics is repaired along, then dropped
  const mission = s.docs.mission.data;
  return {
    events: s.events.filter(isEvent).slice(0, MAX_EVENTS), // a bad event from the server is dropped, as one from storage is
    settings: { muted: settings.muted, volumes: settings.volumes, ambienceMix: settings.ambienceMix, hiddenWidgets: settings.hidden, hudSize: settings.hudSize, motion: settings.motion, todoCollapsed: settings.todoCollapsed },
    mission: { mission: clampText(mission?.text ?? ""), missionDone: mission?.done ?? false, missionDeadline: repairDeadline(mission?.deadline) },
    todos: repairTodos(s.docs.todos.data.todos, s.docs.todos.data.nextTodoId),
    stamps: { settings: s.docs.settings.updatedAt, mission: s.docs.mission.updatedAt, todos: s.docs.todos.updatedAt },
  };
}
