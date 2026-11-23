/**
 * App state: one reducer, one `layer` value (spec §4.2 — no router). Pure and testable;
 * the React provider lives in state/StoreProvider.tsx. In-memory only until M3 adds persistence.
 */
import { recordSession, type StampedDay } from "@/domain/calendar";
import { HOME_LOCATION_ID } from "@/content/registry";
import { ui } from "@/content/copy";
import { RELEASE_VERSION, THREADS } from "@/content/threads";
import { clampText, MAX_TODOS } from "@/domain/limits";
import { answer, pendingAsk, post, skip, stepAll, type Facts, type Progress } from "@/domain/story";
import { HUD_SIZES, type HudSize, type WidgetId, TOGGLEABLE_WIDGETS } from "@/hud/slots";
import { DEFAULT_PREFERENCES, DEFAULT_VOLUMES, type MotionSetting, type Volumes } from "./persistence/schema";
import { initialTimer, remainingMs, transition, type TimerEvent, type TimerState } from "@/domain/timer";
import type { ProgressEvent } from "@/domain/progress";
import { bannersFor, type BannerMessage } from "./banners";
import { derive } from "./derive";

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
  /** Days studied, each with the stamp design earned at the time (calendar, spec §3.4). */
  studiedDays: readonly StampedDay[];
  unreadThreads: string[];
  /** How far each thread has got and what has been said in it (domain/story.ts). Persisted. */
  story: Progress;
  /** The thread open in the phone, or null for the list. Not persisted. */
  phoneThread: string | null;
  /** The location sign is big, in the middle of the room, holding before it settles into its corner. Not persisted. */
  signArriving: boolean;
  /** The place has said its idle line for this stretch of idling. Not persisted; cleared when a session starts. */
  idleSaid: boolean;
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
  /** Transient banners waiting to be shown, oldest first. Never saved. */
  banners: BannerMessage[];
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
  studiedDays: [],
  unreadThreads: [],
  story: {},
  phoneThread: null,
  idleSaid: false,
  signArriving: false,
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
  banners: [],
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
  /** The reveal begins: the destination is now the current place (so the wipe shows its room), though travel is not over yet. */
  | { type: "TRAVEL_REVEAL" }
  | { type: "ARRIVE" }
  /** The arrival sign has held and goes to its corner. */
  | { type: "SIGN_SETTLED" }
  | { type: "READ_THREAD"; id: string }
  /** Open a thread in the phone (or go back to the list with null). */
  | { type: "OPEN_THREAD"; id: string | null }
  /** The player answers the question a thread is waiting on (their name, in onboarding). */
  | { type: "ANSWER_THREAD"; id: string; text: string }
  /** The player writes in a thread that allows it (feedback). */
  | { type: "POST_MESSAGE"; id: string; text: string }
  /** Skip onboarding with one key: it ends at once, and the level-2 map is still granted (spec §3.5). */
  | { type: "SKIP_ONBOARDING" }
  /** The player has been idle in the room for a while: the place says one line (once per stretch of idling). */
  | { type: "SAY_IDLE" }
  /** Dev panel: run onboarding again from the start. */
  | { type: "REPLAY_ONBOARDING" }
  | { type: "SET_PHONE"; open: boolean }
  | { type: "MARK_ALL_UNREAD"; ids: string[] }
  /** A save did not reach storage: say so instead of letting the user believe progress is kept. */
  | { type: "STORAGE_FAILED" }
  | { type: "DISMISS_BANNER" }
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

/**
 * Cap on waiting banners. A burst fits: Knowledge, the level, one gift per level crossed and the unlock notice (a first
 * session of two hours crosses three levels). Past the cap the OLDEST are dropped, so a flood never costs the newest news.
 */
export const MAX_BANNERS = 12;

/** Is onboarding under way (begun, not finished or skipped)? While it is, nothing else speaks over Morgana. */
export const onboardingRunning = (state: AppState): boolean => !!state.story["morgana"] && !state.story["morgana"].done;

/** What the thread interpreter may look at (domain/story.ts `Facts`), taken from the state. */
export function factsFor(state: AppState): Facts {
  return {
    entered: state.entered,
    firstVisit: state.firstVisit,
    name: state.name,
    missionSet: state.mission !== "" || state.events.some((e) => e.kind === "mission_first_set"),
    sessionsCompleted: state.events.filter((e) => e.kind === "session" && e.outcome === "completed").length,
    visited: state.visited,
    unlocked: derive(state).unlocked,
    release: RELEASE_VERSION,
    defaultName: ui.defaultName,
  };
}

/**
 * Let every thread react to what just changed: start those whose moment has come, move the running ones on, give the
 * Knowledge a `grant` step asked for (once), mark threads that said something unread, and open the phone on Morgana when
 * onboarding begins so the first conversation is in front of the player (spec §3.5).
 */
export function settle(state: AppState): AppState {
  const result = stepAll(THREADS, state.story, factsFor(state));
  if (result.progress === state.story) return state;
  const events = [...state.events];
  for (const effect of result.effects) {
    if (!events.some((e) => e.kind === "story_grant" && e.key === effect.key)) events.push({ kind: "story_grant", key: effect.key, knowledge: effect.xp });
  }
  const startedOnboarding = !state.story["morgana"] && !!result.progress["morgana"];
  const gainedIds = Object.keys(result.gained).filter((id) => !(startedOnboarding && id === "morgana"));
  const unread = [...state.unreadThreads, ...gainedIds.filter((id) => !state.unreadThreads.includes(id))];
  return { ...state, story: result.progress, events, unreadThreads: unread, ...(startedOnboarding ? { phoneOpen: true, phoneThread: "morgana" } : {}) };
}

/** The reducer proper plus the story and the banners each change deserves (pure rules in domain/story.ts and banners.ts). */
export function reducer(state: AppState, action: Action): AppState {
  const raw = coreReducer(state, action);
  // A session that has started ends the stretch of idling: the place may speak again next time.
  const core = raw.idleSaid && raw.timer.status !== "idle" ? { ...raw, idleSaid: false } : raw;
  const next = action.type === "DISMISS_BANNER" || action.type === "RESET" ? core : settle(core);
  if (action.type === "DISMISS_BANNER" || action.type === "RESET" || action.type === "LOAD") return next;
  const fresh = bannersFor(state, next);
  if (fresh.length === 0) return next;
  // The greeting comes first: Sojiro says hello, then the news waiting from a session that ended while the tab was closed.
  const greeting = fresh.filter((b) => b.id === "back");
  const rest = fresh.filter((b) => b.id !== "back");
  return { ...next, banners: [...greeting, ...next.banners, ...rest].slice(-MAX_BANNERS) };
}

/**
 * Make `id` the current place: remember the visit, and let the location sign arrive big when it is the first time there.
 * Idempotent, so the reveal and the end of travel can both call it (the sign arrives once, at the first of them).
 */
function arriveAt(state: AppState, id: string): AppState {
  const first = !state.visited.includes(id);
  return { ...state, locationId: id, visited: first ? [...state.visited, id] : state.visited, signArriving: state.signArriving || first };
}

function coreReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_LAYER":
      return { ...state, layer: action.layer };
    case "ENTER":
      // A session that ended while the tab was closed is waiting for its choice (see persistence/mapping).
      return { ...state, layer: state.timer.status === "complete" ? "choice" : "main", entered: true, signArriving: state.firstVisit };
    case "CLOSE_LAYER":
      // Closing a screen returns to where the user was: the splash before entering, the room after.
      // The info pages hang off Settings once the user is in the room.
      if (state.entered && (state.layer === "about" || state.layer === "credits" || state.layer === "privacy")) return { ...state, layer: "settings" };
      return { ...state, layer: state.entered ? "main" : "splash" };
    case "SET_MISSION": {
      const text = clampText(action.text);
      const first = text !== "" && !state.events.some((e) => e.kind === "mission_first_set");
      // Clearing the mission also clears its deadline; changing it keeps the deadline.
      // Re-submitting the same text (e.g. to change the deadline) keeps the mission as it is, done or not.
      return { ...state, mission: text, missionDone: text === state.mission ? state.missionDone : false, missionDeadline: text === "" ? null : state.missionDeadline, events: first ? [...state.events, { kind: "mission_first_set" }] : state.events };
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
        // Stamped on the day the session really ended (its end time), even if the tab only noticed a little later.
        return { ...state, timer: after, ...recordSession(state.events, state.studiedDays, done, before.endsAt), layer: "choice" };
      }
      // Stopping — from running or from paused — records the focused time so far as a cut-short session.
      if ((before.status === "running" || before.status === "paused") && action.event.type === "STOP") {
        const focusedMs = before.durationMs - remainingMs(before, action.now);
        return { ...state, timer: after, ...recordSession(state.events, state.studiedDays, { kind: "session", plannedMs: before.durationMs, focusedMs, outcome: "stopped" }, action.now), layer: "summary" };
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
    case "TRAVEL_REVEAL":
      return state.travelTo ? arriveAt(state, state.travelTo) : state;
    case "ARRIVE": {
      if (!state.travelTo) return { ...state, layer: "main" };
      const there = arriveAt(state, state.travelTo);
      return { ...there, layer: "main", travelTo: null };
    }
    case "SIGN_SETTLED":
      return state.signArriving ? { ...state, signArriving: false } : state;
    case "READ_THREAD":
      return { ...state, unreadThreads: state.unreadThreads.filter((id) => id !== action.id) };
    case "DISMISS_BANNER":
      return state.banners.length === 0 ? state : { ...state, banners: state.banners.slice(1) };
    case "STORAGE_FAILED":
      return state.storageBlocked ? state : { ...state, storageBlocked: true };
    case "MARK_ALL_UNREAD":
      return { ...state, unreadThreads: action.ids };
    case "SET_PHONE":
      return { ...state, phoneOpen: action.open };
    case "SAY_IDLE":
      // Only in the room, with the timer idle, in a real visit, not while Morgana is still onboarding the player, and once until a session has started and ended.
      return state.entered && state.layer === "main" && state.timer.status === "idle" && !state.idleSaid && !state.demo && !onboardingRunning(state) ? { ...state, idleSaid: true } : state;
    case "OPEN_THREAD":
      return { ...state, phoneThread: action.id, unreadThreads: action.id ? state.unreadThreads.filter((id) => id !== action.id) : state.unreadThreads };
    case "ANSWER_THREAD": {
      const thread = THREADS.find((t) => t.id === action.id);
      const progress = state.story[action.id];
      if (!thread || !progress) return state;
      const asked = pendingAsk(thread, progress);
      const said = clampText(action.text);
      const nextProgress = answer(thread, progress, said, asked === "name" ? said : state.name || ui.defaultName);
      if (nextProgress === progress) return state;
      return { ...state, story: { ...state.story, [action.id]: nextProgress }, name: asked === "name" ? said : state.name };
    }
    case "POST_MESSAGE": {
      const thread = THREADS.find((t) => t.id === action.id);
      const progress = state.story[action.id];
      if (!thread || !progress) return state;
      const nextProgress = post(thread, progress, action.text, state.name || ui.defaultName);
      return nextProgress === progress ? state : { ...state, story: { ...state.story, [action.id]: nextProgress } };
    }
    case "SKIP_ONBOARDING": {
      const thread = THREADS.find((t) => t.id === "morgana");
      if (!thread || state.story["morgana"]?.done) return state;
      // The first-mission Knowledge is what opens the map (level 2); a skipped onboarding still gets it, once.
      const events: ProgressEvent[] = state.events.some((e) => e.kind === "mission_first_set") ? state.events : [...state.events, { kind: "mission_first_set" }];
      return { ...state, story: { ...state.story, morgana: skip(thread, state.story["morgana"]) }, events };
    }
    case "REPLAY_ONBOARDING": {
      const { morgana: _removed, ...rest } = state.story;
      void _removed;
      return { ...state, story: rest, firstVisit: true, unreadThreads: state.unreadThreads.filter((id) => id !== "morgana") };
    }
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
      // Demo stays demo, and the analytics choice is never silently undone by a reset.
      return { ...initialState, layer: "splash", demo: state.demo, storageBlocked: state.storageBlocked, analytics: state.analytics };
  }
}

/** Threads that start unread in the demo (spec §3.12: one unread message). */
export const DEMO_UNREAD = [THREADS[0]?.id ?? "morgana"];

export { derive, type Derived } from "./derive";
