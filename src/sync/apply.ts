import { clampText, MAX_EVENTS } from "@/domain/limits";
import { isEvent } from "@/state/persistence/guard";
import { repairDeadline, repairSettings } from "@/state/persistence/repair";
import { repairTodos, toPersisted } from "@/state/persistence/mapping";
import type { Persisted } from "@/state/persistence/schema";
import type { AppState, SyncPatch } from "@/state/store";
import type { Snapshot } from "./types";

/** What of the current state is synced, with the time each document last changed (the same stamps the saver writes). */
export function snapshotFromState(state: AppState, base: Persisted, nowIso: string): Snapshot {
  const p = toPersisted(state, base, nowIso);
  return {
    events: p.events,
    docs: {
      settings: { data: p.settings, updatedAt: p.stamps.settings },
      mission: { data: p.mission, updatedAt: p.stamps.mission },
      todos: { data: { todos: p.todos, nextTodoId: p.nextTodoId }, updatedAt: p.stamps.todos },
    },
  };
}

/**
 * A merged snapshot as the state fields it sets. Everything from the server goes through the same repair functions as a
 * save read from storage, so a bad or hostile document cannot put impossible values into the state.
 */
export function patchFromSnapshot(s: Snapshot): SyncPatch {
  const settings = repairSettings(s.docs.settings.data);
  const mission = s.docs.mission.data;
  return {
    events: s.events.filter(isEvent).slice(0, MAX_EVENTS), // a bad event from the server is dropped, as one from storage is
    muted: settings.muted,
    volumes: settings.volumes,
    ambienceMix: settings.ambienceMix,
    hiddenWidgets: settings.hidden,
    hudSize: settings.hudSize,
    motion: settings.motion,
    analytics: settings.analytics,
    todoCollapsed: settings.todoCollapsed,
    mission: clampText(mission?.text ?? ""),
    missionDone: mission?.done ?? false,
    missionDeadline: repairDeadline(mission?.deadline),
    ...repairTodos(s.docs.todos.data.todos, s.docs.todos.data.nextTodoId),
  };
}
