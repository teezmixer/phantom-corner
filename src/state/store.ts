/**
 * App state: one reducer, one `layer` value (spec §4.2 — no router). Pure and testable;
 * the React provider lives in state/StoreProvider.tsx. In-memory only until M3 adds persistence.
 */
import { LOCATIONS, HOME_LOCATION_ID } from "@/content/registry";
import { THREADS } from "@/content/threads";
import { MAP_UNLOCK_LEVEL } from "@/content/progression";
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
  name: string;
  locationId: string;
  travelTo: string | null;
  visited: string[];
  mission: string;
  todos: Todo[];
  nextTodoId: number;
  timer: TimerState;
  breakEndsAt: number | null;
  events: ProgressEvent[];
  unreadThreads: string[];
  phoneOpen: boolean;
  hudHidden: boolean;
  muted: boolean;
  /** Dev panel: treat every location as unlocked. */
  devUnlockAll: boolean;
  /** Demo mode never touches saved progress. */
  demo: boolean;
}

export const BREAK_MS = 5 * 60_000;

export const initialState: AppState = {
  layer: "splash",
  entered: false,
  name: "",
  locationId: HOME_LOCATION_ID,
  travelTo: null,
  visited: [HOME_LOCATION_ID],
  mission: "",
  todos: [],
  nextTodoId: 1,
  timer: initialTimer,
  breakEndsAt: null,
  events: [],
  unreadThreads: [],
  phoneOpen: false,
  hudHidden: false,
  muted: false,
  devUnlockAll: false,
  demo: false,
};

export type Action =
  | { type: "SET_LAYER"; layer: Layer }
  | { type: "ENTER" }
  | { type: "CLOSE_LAYER" }
  | { type: "SET_MISSION"; text: string }
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
  | { type: "TOGGLE_HUD" }
  | { type: "TOGGLE_MUTE" }
  | { type: "DEV_GRANT"; knowledge: number }
  | { type: "DEV_UNLOCK_ALL" }
  | { type: "DEV_JUMP_LOCATION"; id: string }
  | { type: "LOAD"; state: AppState }
  | { type: "RESET" };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_LAYER":
      return { ...state, layer: action.layer };
    case "ENTER":
      return { ...state, layer: "main", entered: true };
    case "CLOSE_LAYER":
      // Closing a screen returns to where the user was: the splash before entering, the room after.
      return { ...state, layer: state.entered ? "main" : "splash" };
    case "SET_MISSION": {
      const text = action.text.trim();
      const first = text !== "" && !state.events.some((e) => e.kind === "mission_first_set");
      return { ...state, mission: text, events: first ? [...state.events, { kind: "mission_first_set" }] : state.events };
    }
    case "ADD_TODO": {
      const text = action.text.trim();
      if (!text) return state;
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
      if (before.status === "running" && action.event.type === "STOP") {
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
      return { ...state, layer: "travel", travelTo: action.to };
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
    case "MARK_ALL_UNREAD":
      return { ...state, unreadThreads: action.ids };
    case "SET_PHONE":
      return { ...state, phoneOpen: action.open };
    case "TOGGLE_HUD":
      return { ...state, hudHidden: !state.hudHidden };
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
      return { ...initialState, layer: "splash" };
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
