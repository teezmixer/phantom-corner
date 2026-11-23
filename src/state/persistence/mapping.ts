import { clampText, MAX_TODOS } from "@/domain/limits";
import { isEvent } from "./guard";
import { repairDeadline, repairSettings } from "./repair";
import { initialState, type AppState, type Todo } from "../store";
import type { Persisted } from "./schema";

/**
 * Stored data → app state, at the start of a visit. Pure: `now` is injected.
 * Resume after reload (spec §4.5, §3.4): a running timer keeps its `endsAt`; one that ended while the tab was closed
 * still counts as a completed session ("sessions ending with the tab closed still count") and waits at the choice.
 */
/**
 * Repair what is recoverable instead of throwing progress away: over-long text is cut, duplicate todo ids get fresh
 * ones, and the next id is always above every existing id.
 */
export function repairTodos(todos: readonly Todo[], nextTodoId: number): { todos: Todo[]; nextTodoId: number } {
  const seen = new Set<number>();
  // Cut first, then fold: spreading a huge array into Math.max overflows the call stack.
  const kept = todos.slice(0, MAX_TODOS);
  let next = kept.reduce((max, t) => Math.max(max, t.id + 1), Math.max(nextTodoId, 1));
  const repaired: Todo[] = [];
  for (const t of kept) {
    const text = clampText(t.text);
    if (!text) continue;
    let id = t.id;
    if (seen.has(id)) id = next++;
    seen.add(id);
    repaired.push({ id, text, done: t.done });
  }
  return { todos: repaired, nextTodoId: next };
}

export function stateFromPersisted(p: Persisted, now: number, flags: { recovered: boolean; storageBlocked: boolean; firstVisit?: boolean }): AppState {
  let timer = p.timer;
  // A single impossible event is dropped; the rest of the history is kept.
  let events = p.events.filter(isEvent);
  // An end time further away than the whole session (a corrupt value, or the clock moved) is pulled back to a full session.
  if (timer.status === "running") timer = { ...timer, endsAt: Math.min(timer.endsAt, now + timer.durationMs) };
  if (timer.status === "running" && now >= timer.endsAt) {
    events = [...events, { kind: "session", plannedMs: timer.durationMs, focusedMs: timer.durationMs, outcome: "completed" }];
    timer = { status: "complete", durationMs: timer.durationMs };
  }
  const settings = repairSettings(p.settings);
  return {
    ...initialState,
    name: p.name ?? "",
    muted: settings.muted,
    volumes: settings.volumes,
    ambienceMix: settings.ambienceMix,
    mission: clampText(p.mission?.text ?? ""),
    missionDone: p.mission?.done ?? false,
    missionDeadline: repairDeadline(p.mission?.deadline),
    hiddenWidgets: settings.hidden,
    hudSize: settings.hudSize,
    motion: settings.motion,
    analytics: settings.analytics,
    todoCollapsed: settings.todoCollapsed,
    ...repairTodos(p.todos, p.nextTodoId),
    timer,
    locationId: p.locationId,
    visited: p.visited,
    events,
    unreadThreads: p.unreadThreads,
    firstVisit: flags.firstVisit ?? false,
    recovered: flags.recovered,
    storageBlocked: flags.storageBlocked,
  };
}

/**
 * App state → stored data. `prev` supplies the identity and the last-changed stamps; a stamp moves only when its
 * slice actually changed, which is what sync compares later (M11). UI state is never stored.
 */
export function toPersisted(state: AppState, prev: Persisted, nowIso: string): Persisted {
  const missionChanged = (prev.mission?.text ?? "") !== state.mission || (prev.mission?.done ?? false) !== state.missionDone || (prev.mission?.deadline ?? null) !== state.missionDeadline;
  const todosChanged = JSON.stringify(prev.todos) !== JSON.stringify(state.todos);
  const settings = {
    muted: state.muted,
    volumes: state.volumes,
    ambienceMix: state.ambienceMix,
    hidden: state.hiddenWidgets,
    hudSize: state.hudSize,
    motion: state.motion,
    analytics: state.analytics,
    todoCollapsed: state.todoCollapsed,
  };
  const settingsChanged = JSON.stringify(prev.settings) !== JSON.stringify(settings);
  return {
    schema: 3,
    clientId: prev.clientId,
    name: state.name === "" ? null : state.name,
    settings,
    mission: state.mission === "" ? null : { text: state.mission, setAt: missionChanged && (prev.mission?.text ?? "") !== state.mission ? nowIso : (prev.mission?.setAt ?? nowIso), done: state.missionDone, ...(state.missionDeadline ? { deadline: state.missionDeadline } : {}) },
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
