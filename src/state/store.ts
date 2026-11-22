/**
 * App state: one reducer, one `layer` value (spec §4.2 — no router). Pure and testable;
 * the React provider lives in state/StoreProvider.tsx. In-memory only until M3 adds persistence.
 */
import { LOCATIONS, HOME_LOCATION_ID } from "@/content/registry";
import { THREADS } from "@/content/threads";
import { MAP_UNLOCK_LEVEL } from "@/content/progression";
import { clampText, MAX_TODOS } from "@/domain/limits";
import { HUD_SIZES, type HudSize, type WidgetId, TOGGLEABLE_WIDGETS } from "@/hud/slots";
import { DEFAULT_PREFERENCES, DEFAULT_VOLUMES, type MotionSetting, type Volumes } from "./persistence/schema";
import { initialTimer, remainingMs, transition, type TimerEvent, type TimerState } from "@/domain/timer";
import { knowledgeFor, levelForKnowledge, unlockedIds, type ProgressEvent } from "@/domain/progress";

export type Layer =
  | "splash" | "main" | "menu" | "map" | "travel" | "settings" | "profile"
  | "summary" | "choice" | "break" | "about" | "credits" | "privacy";

export interface Todo { id: number; text: string; done: boolean }

export interface AppState {
  layer: Layer;
  /** True once the user has pressed through the splash. */
  entered: boolean;
  /** True only on the very first visit (nothing was stored). Drives the doorbell; never persisted. */
  firstVisit: boolean;
  name: string;
  locationId: string;
  travelTo: string | null;
  visited: string[];
  mission: string;
  missionDone: boolean;
  /** ISO time the mission is due, or null. */
  missionDeadline: string | null;
  todos: Todo[];
  nextTodoId: number;
  timer: TimerState;
  breakEndsAt: number | null;
  events: ProgressEvent[];
  unreadThreads: string[];
  phoneOpen: boolean;
  hudHidden: boolean;
  muted: boolean;
  volumes: Volumes;
  /** Per-ambience-layer level, 0–1, keyed by layer id; a missing layer plays at full (the bus volume still applies). */
  ambienceMix: Record<string, number>;
  /** Widgets hidden in Settings (never the TV or the button bar). */
  hiddenWidgets: WidgetId[];
  hudSize: HudSize;
  motion: MotionSetting;
  /** Anonymous analytics switch (provisional default on, D-14). */
  analytics: boolean;
  todoCollapsed: boolean;
  /** Dev panel: treat every location as unlocked. */
  devUnlockAll: boolean;
  /** Demo mode never touches saved progress. */
  demo: boolean;
  /** Stored data was unreadable this visit, so we started fresh (spec §3.11). */
  recovered: boolean;
  /** The browser would not let us store anything; progress lasts only for this visit (spec §3.11). */
  storageBlocked: boolean;
}

export const BREAK_MS = 5 * 60_000;

export const initialState: AppState = {
  layer: "splash",
  entered: false,
  firstVisit: false,
  name: "",
  locationId: HOME_LOCATION_ID,
  travelTo: null,
  visited: [HOME_LOCATION_ID],
  mission: "",
  missionDone: false,
  missionDeadline: null,
  todos: [],
  nextTodoId: 1,
  timer: initialTimer,
  breakEndsAt: null,
  events: [],
  unreadThreads: [],
  phoneOpen: false,
  hudHidden: false,
  muted: false,
  volumes: { ...DEFAULT_VOLUMES },
  ambienceMix: {},
  hiddenWidgets: [...DEFAULT_PREFERENCES.hidden],
  hudSize: DEFAULT_PREFERENCES.hudSize,
  motion: DEFAULT_PREFERENCES.motion,
  analytics: DEFAULT_PREFERENCES.analytics,
  todoCollapsed: DEFAULT_PREFERENCES.todoCollapsed,
  devUnlockAll: false,
  demo: false,
  recovered: false,
  storageBlocked: false,
};

export type Action =
  | { type: "SET_LAYER"; layer: Layer }
  | { type: "ENTER" }
  | { type: "CLOSE_LAYER" }
  | { type: "SET_MISSION"; text: string }
  | { type: "TOGGLE_MISSION_DONE" }
  | { type: "SET_DEADLINE"; iso: string | null }
  | { type: "TOGGLE_WIDGET"; id: WidgetId }
  | { type: "SET_HUD_SIZE"; size: number }
  | { type: "SET_MOTION"; motion: MotionSetting }
  | { type: "SET_ANALYTICS"; on: boolean }
  | { type: "SET_TODO_COLLAPSED"; collapsed: boolean }
  | { type: "ADD_TODO"; text: string }
  | { type: "TOGGLE_TODO"; id: number }
  | { type: "DELETE_TODO"; id: number }
  | { type: "SET_TODOS"; todos: Todo[] }
  /** `now` is injected so the reducer stays pure; it is only used to size a cut-short session. */
  | { type: "TIMER"; event: TimerEvent; now: number }
  | { type: "START_SESSION"; now: number }
  | { type: "FINISH" }
  | { type: "START_BREAK"; now: number }
  | { type: "END_BREAK" }
  | { type: "START_TRAVEL"; to: string }
  | { type: "ARRIVE" }
  | { type: "READ_THREAD"; id: string }
  | { type: "SET_PHONE"; open: boolean }
  | { type: "MARK_ALL_UNREAD"; ids: string[] }
  /** A save did not reach storage: say so instead of letting the user believe progress is kept. */
  | { type: "STORAGE_FAILED" }
  | { type: "TOGGLE_HUD" }
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_VOLUME"; bus: keyof Volumes; value: number }
  | { type: "SET_LAYER_VOLUME"; id: string; value: number }
  | { type: "DEV_GRANT"; knowledge: number }
  | { type: "DEV_UNLOCK_ALL" }
  | { type: "DEV_JUMP_LOCATION"; id: string }
  | { type: "LOAD"; state: AppState }
  | { type: "RESET" };

/** A volume forced into 0–1; junk becomes 0 (silent is the safe failure). */
function unit(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_LAYER":
      return { ...state, layer: action.layer };
    case "ENTER":
      // A session that ended while the tab was closed is waiting for its choice (see persistence/mapping).
      return { ...state, layer: state.timer.status === "complete" ? "choice" : "main", entered: true };
    case "CLOSE_LAYER":
      // Closing a screen returns to where the user was: the splash before entering, the room after.
      // The info pages hang off Settings once the user is in the room.
      if (state.entered && (state.layer === "about" || state.layer === "credits" || state.layer === "privacy")) return { ...state, layer: "settings" };
      return { ...state, layer: state.entered ? "main" : "splash" };
    case "SET_MISSION": {
      const text = clampText(action.text);
      const first = text !== "" && !state.events.some((e) => e.kind === "mission_first_set");
      // Clearing the mission also clears its deadline; changing it keeps the deadline.
      return { ...state, mission: text, missionDone: false, missionDeadline: text === "" ? null : state.missionDeadline, events: first ? [...state.events, { kind: "mission_first_set" }] : state.events };
    }
    case "SET_DEADLINE":
      return state.mission ? { ...state, missionDeadline: action.iso && !Number.isNaN(Date.parse(action.iso)) ? action.iso : null } : state;
    case "TOGGLE_WIDGET": {
      if (!(TOGGLEABLE_WIDGETS as readonly WidgetId[]).includes(action.id)) return state; // the TV and button bar are never hidden
      const hidden = state.hiddenWidgets.includes(action.id) ? state.hiddenWidgets.filter((w) => w !== action.id) : [...state.hiddenWidgets, action.id];
      return { ...state, hiddenWidgets: hidden };
    }
    case "SET_HUD_SIZE":
      return (HUD_SIZES as readonly number[]).includes(action.size) ? { ...state, hudSize: action.size as HudSize } : state;
    case "SET_MOTION":
      return { ...state, motion: action.motion };
    case "SET_ANALYTICS":
      return { ...state, analytics: action.on };
    case "SET_TODO_COLLAPSED":
      return { ...state, todoCollapsed: action.collapsed };
    case "TOGGLE_MISSION_DONE":
      return state.mission ? { ...state, missionDone: !state.missionDone } : state;
    case "ADD_TODO": {
      const text = clampText(action.text);
      if (!text || state.todos.length >= MAX_TODOS) return state;
      return { ...state, todos: [...state.todos, { id: state.nextTodoId, text, done: false }], nextTodoId: state.nextTodoId + 1 };
    }
    case "TOGGLE_TODO":
      return { ...state, todos: state.todos.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)) };
    case "SET_TODOS":
      return { ...state, todos: action.todos };
    case "DELETE_TODO":
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
    case "TIMER": {
      const before = state.timer;
      const after = transition(before, action.event);
      if (after === before) return state;
      // A running timer that completes is a finished session; stopping it early is a cut-short one.
      if (before.status === "running" && after.status === "complete") {
        const done: ProgressEvent = { kind: "session", plannedMs: before.durationMs, focusedMs: before.durationMs, outcome: "completed" };
        return { ...state, timer: after, events: [...state.events, done], layer: "choice" };
      }
      // Stopping — from running or from paused — records the focused time so far as a cut-short session.
      if ((before.status === "running" || before.status === "paused") && action.event.type === "STOP") {
        const focusedMs = before.durationMs - remainingMs(before, action.now);
        return { ...state, timer: after, events: [...state.events, { kind: "session", plannedMs: before.durationMs, focusedMs, outcome: "stopped" }], layer: "summary" };
      }
      return { ...state, timer: after };
    }
    case "START_SESSION": {
      // From a finished or idle timer straight into a new session at the same length.
      const fresh = transition(transition(state.timer, { type: "ACKNOWLEDGE" }), { type: "START", now: action.now });
      return { ...state, timer: fresh, layer: "main", breakEndsAt: null };
    }
    case "FINISH":
      return { ...state, timer: transition(state.timer, { type: "ACKNOWLEDGE" }), layer: "main", breakEndsAt: null };
    case "START_BREAK":
      return { ...state, layer: "break", breakEndsAt: action.now + BREAK_MS, timer: transition(state.timer, { type: "ACKNOWLEDGE" }) };
    case "END_BREAK":
      return { ...state, layer: "choice", breakEndsAt: null };
    case "START_TRAVEL":
      // Travelling is allowed mid-session and never stops a running timer (provisional rule, decision D-22).
      // A finished timer is acknowledged so it does not sit at 00:00 with no controls.
      return { ...state, layer: "travel", travelTo: action.to, timer: transition(state.timer, { type: "ACKNOWLEDGE" }) };
    case "ARRIVE":
      if (!state.travelTo) return { ...state, layer: "main" };
      return {
        ...state,
        layer: "main",
        locationId: state.travelTo,
        travelTo: null,
        visited: state.visited.includes(state.travelTo) ? state.visited : [...state.visited, state.travelTo],
      };
    case "READ_THREAD":
      return { ...state, unreadThreads: state.unreadThreads.filter((id) => id !== action.id) };
    case "STORAGE_FAILED":
      return state.storageBlocked ? state : { ...state, storageBlocked: true };
    case "MARK_ALL_UNREAD":
      return { ...state, unreadThreads: action.ids };
    case "SET_PHONE":
      return { ...state, phoneOpen: action.open };
    case "TOGGLE_HUD":
      return { ...state, hudHidden: !state.hudHidden };
    case "SET_VOLUME":
      return { ...state, volumes: { ...state.volumes, [action.bus]: unit(action.value) } };
    case "SET_LAYER_VOLUME":
      return { ...state, ambienceMix: { ...state.ambienceMix, [action.id]: unit(action.value) } };
    case "TOGGLE_MUTE":
      return { ...state, muted: !state.muted };
    case "DEV_GRANT":
      return { ...state, events: [...state.events, { kind: "dev_grant", knowledge: action.knowledge }] };
    case "DEV_UNLOCK_ALL":
      return { ...state, devUnlockAll: true };
    case "DEV_JUMP_LOCATION":
      return { ...state, locationId: action.id, visited: state.visited.includes(action.id) ? state.visited : [...state.visited, action.id], layer: "main" };
    case "LOAD":
      return action.state;
    case "RESET":
      // Demo mode stays demo, so a reset can never turn into writing real progress later (M3 persistence).
      return { ...initialState, layer: "splash", demo: state.demo, storageBlocked: state.storageBlocked };
  }
}

/** Values computed from state; never stored. */
export interface Derived {
  knowledge: number;
  level: number;
  unlocked: string[];
  mapOpen: boolean;
  sessions: number;
  minutesFocused: number;
}

export function derive(state: AppState): Derived {
  const knowledge = knowledgeFor(state.events);
  const level = levelForKnowledge(knowledge);
  const unlocked = state.devUnlockAll ? LOCATIONS.map((l) => l.id) : unlockedIds(level, LOCATIONS);
  const sessionEvents = state.events.filter((e) => e.kind === "session");
  return {
    knowledge,
    level,
    unlocked,
    mapOpen: state.devUnlockAll || level >= MAP_UNLOCK_LEVEL,
    sessions: sessionEvents.length,
    minutesFocused: Math.floor(sessionEvents.reduce((sum, e) => sum + e.focusedMs, 0) / 60_000),
  };
}

/** Threads that start unread in the demo (spec §3.12: one unread message). */
export const DEMO_UNREAD = [THREADS[0]?.id ?? "morgana"];
