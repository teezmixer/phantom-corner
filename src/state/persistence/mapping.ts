import { initialState, type AppState } from "../store";
import type { Persisted } from "./schema";

/**
 * Stored data → app state, at the start of a visit. Pure: `now` is injected.
 * Resume after reload (spec §4.5, §3.4): a running timer keeps its `endsAt`; one that ended while the tab was closed
 * still counts as a completed session ("sessions ending with the tab closed still count") and waits at the choice.
 */
export function stateFromPersisted(p: Persisted, now: number, flags: { recovered: boolean; storageBlocked: boolean }): AppState {
  let timer = p.timer;
  let events = p.events;
  if (timer.status === "running" && now >= timer.endsAt) {
    events = [...events, { kind: "session", plannedMs: timer.durationMs, focusedMs: timer.durationMs, outcome: "completed" }];
    timer = { status: "complete", durationMs: timer.durationMs };
  }
  return {
    ...initialState,
    name: p.name ?? "",
    muted: p.settings.muted,
    mission: p.mission?.text ?? "",
    missionDone: p.mission?.done ?? false,
    todos: p.todos,
    nextTodoId: p.nextTodoId,
    timer,
    locationId: p.locationId,
    visited: p.visited,
    events,
    unreadThreads: p.unreadThreads,
    recovered: flags.recovered,
    storageBlocked: flags.storageBlocked,
  };
}

/**
 * App state → stored data. `prev` supplies the identity and the last-changed stamps; a stamp moves only when its
 * slice actually changed, which is what sync compares later (M11). UI state is never stored.
 */
export function toPersisted(state: AppState, prev: Persisted, nowIso: string): Persisted {
  const missionChanged = (prev.mission?.text ?? "") !== state.mission || (prev.mission?.done ?? false) !== state.missionDone;
  const todosChanged = JSON.stringify(prev.todos) !== JSON.stringify(state.todos);
  const settingsChanged = prev.settings.muted !== state.muted;
  return {
    schema: 1,
    clientId: prev.clientId,
    name: state.name === "" ? null : state.name,
    settings: { muted: state.muted },
    mission: state.mission === "" ? null : { text: state.mission, setAt: missionChanged && (prev.mission?.text ?? "") !== state.mission ? nowIso : (prev.mission?.setAt ?? nowIso), done: state.missionDone },
    todos: state.todos,
    nextTodoId: state.nextTodoId,
    timer: state.timer,
    locationId: state.locationId,
    visited: state.visited,
    events: state.events,
    unreadThreads: state.unreadThreads,
    stamps: {
      settings: settingsChanged ? nowIso : prev.stamps.settings,
      mission: missionChanged ? nowIso : prev.stamps.mission,
      todos: todosChanged ? nowIso : prev.stamps.todos,
    },
  };
}
