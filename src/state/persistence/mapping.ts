import { recordSession, repairStampedDays } from "@/domain/calendar";
import { clampText, MAX_TODOS } from "@/domain/limits";
import { stampEventIds } from "@/domain/progress";
import { isEvent } from "./guard";
import { repairDeadline, repairSettings, repairStory } from "./repair";
import { bannersFor } from "../banners";
import { MAX_BANNERS, initialState, syncGroups, type AppState, type Todo } from "../store";
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
  // Saves from before ids get theirs here (D-24): "<clientId>:<n>" in log order.
  let events = stampEventIds(p.events.filter(isEvent), p.clientId);
  // An end time further away than the whole session (a corrupt value, or the clock moved) is pulled back to a full session.
  if (timer.status === "running") timer = { ...timer, endsAt: Math.min(timer.endsAt, now + timer.durationMs) };
  let studiedDays = repairStampedDays(p.studiedDays);
  // What the player should hear about a session that finished while the tab was closed (Knowledge, level, gifts, unlocks):
  // the same notices a session finished in front of them would have brought, worked out against the log without it.
  let offlineBanners: AppState["banners"] = [];
  if (timer.status === "running" && now >= timer.endsAt) {
    const before = events;
    // The day is the one the session really ended on, not the day the tab was reopened.
    ({ events, studiedDays } = recordSession(events, studiedDays, { kind: "session", plannedMs: timer.durationMs, focusedMs: timer.durationMs, outcome: "completed" }, timer.endsAt) as { events: typeof events; studiedDays: typeof studiedDays });
    timer = { status: "complete", durationMs: timer.durationMs };
    offlineBanners = bannersFor({ ...initialState, events: before }, { ...initialState, events });
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
    menuStyle: settings.menuStyle,
    ...repairTodos(p.todos, p.nextTodoId),
    timer,
    locationId: p.locationId,
    visited: p.visited,
    events,
    clientId: p.clientId,
    memberSince: typeof p.createdAt === "string" && !Number.isNaN(Date.parse(p.createdAt)) ? p.createdAt : null,
    studiedDays,
    banners: offlineBanners.slice(-MAX_BANNERS),
    unreadThreads: p.unreadThreads,
    story: repairStory(p.story),
    firstVisit: flags.firstVisit ?? false,
    recovered: flags.recovered,
    storageBlocked: flags.storageBlocked,
  };
}

/** A changed document is dated now, unless it is exactly what a sync just brought in: then it keeps the time it came with. */
function stampFor(state: AppState, doc: "settings" | "mission" | "todos", nowIso: string): string {
  const adopted = state.adopted?.[doc];
  return adopted && adopted.key === syncGroups(state)[doc] ? adopted.stamp : nowIso;
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
    menuStyle: state.menuStyle,
  };
  const settingsChanged = JSON.stringify(prev.settings) !== JSON.stringify(settings);
  return {
    schema: 5,
    clientId: prev.clientId,
    createdAt: prev.createdAt ?? nowIso,
    name: state.name === "" ? null : state.name,
    settings,
    mission: state.mission === "" ? null : { text: state.mission, setAt: missionChanged && (prev.mission?.text ?? "") !== state.mission ? nowIso : (prev.mission?.setAt ?? nowIso), done: state.missionDone, ...(state.missionDeadline ? { deadline: state.missionDeadline } : {}) },
    todos: state.todos,
    nextTodoId: state.nextTodoId,
    timer: state.timer,
    locationId: state.locationId,
    visited: state.visited,
    events: state.events,
    studiedDays: [...state.studiedDays],
    unreadThreads: state.unreadThreads,
    story: { ...state.story },
    stamps: {
      settings: settingsChanged ? stampFor(state, "settings", nowIso) : prev.stamps.settings,
      mission: missionChanged ? stampFor(state, "mission", nowIso) : prev.stamps.mission,
      todos: todosChanged ? stampFor(state, "todos", nowIso) : prev.stamps.todos,
    },
  };
}
