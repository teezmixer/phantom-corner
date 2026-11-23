import type { ProgressEvent } from "@/domain/progress";
import type { HudSize, WidgetId } from "@/hud/slots";
import type { StampedDay } from "@/domain/calendar";
import type { ThreadProgress } from "@/domain/story";
import type { TimerState } from "@/domain/timer";

/** The one storage key (spec §4.7). `v1` is the key's generation, not the schema version inside it. */
export const STORAGE_KEY = "pc:v1";
export const CURRENT_SCHEMA = 5;

/** Volumes per sound bus, 0–1. Music is the YouTube player's own volume; ambience and interface go through Web Audio. */
export interface Volumes { music: number; ambience: number; ui: number }

export type MotionSetting = "system" | "reduced";
export type MenuStyle = "text" | "illustrated";

/** What is written to storage (schema 5; see migrate.ts for how older saves are upgraded). UI state — layer, open phone, hidden HUD — is never persisted. */
export interface Persisted {
  schema: 5;
  /** Random id generated on first run; used by sync later (M11). */
  clientId: string;
  /** When this save was first made (ISO), for "member since". Absent in saves from before it; filled in at the next save. */
  createdAt?: string;
  name: string | null;
  settings: {
    muted: boolean;
    volumes: Volumes;
    /** Per-ambience-layer level, 0–1 (layer id → level). */
    ambienceMix: Record<string, number>;
    /** Widgets the user has hidden in Settings. */
    hidden: WidgetId[];
    hudSize: HudSize;
    /** "reduced" forces reduced motion; "system" follows the operating system. */
    motion: MotionSetting;
    /** Anonymous page and speed analytics (provisional default on, decision D-14). */
    analytics: boolean;
    todoCollapsed: boolean;
    /** How the hideout menu looks: plain text, or with a slot for the illustrated Student Ren (D-36). */
    menuStyle: MenuStyle;
  };
  mission: { text: string; setAt: string; done: boolean; /** ISO time the mission is due. */ deadline?: string } | null;
  todos: { id: number; text: string; done: boolean }[];
  nextTodoId: number;
  timer: TimerState;
  locationId: string;
  visited: string[];
  events: ProgressEvent[];
  /** The days studied, each with the calendar stamp design earned at the time (spec §3.4). Events carry no dates, so this is the record of when. */
  studiedDays: StampedDay[];
  unreadThreads: string[];
  /** How far each thread has got and what was said in it, by thread id (spec §4.6). Onboarding runs once because its progress is saved. */
  story: Record<string, ThreadProgress>;
  /** Last-changed times per slice, used by sync to pick the newer side (M11). */
  stamps: { settings: string; mission: string; todos: string };
}

/** PROVISIONAL defaults (decision D-25): quiet ambience, UI sounds clearly audible, music at half. */
export const DEFAULT_VOLUMES: Volumes = { music: 0.5, ambience: 0.35, ui: 0.7 };

/** PROVISIONAL defaults for the new preferences (decisions D-14, D-28). */
export const DEFAULT_PREFERENCES = {
  hidden: [] as WidgetId[],
  hudSize: 1 as HudSize,
  motion: "system" as MotionSetting,
  analytics: true,
  todoCollapsed: false,
  menuStyle: "text" as MenuStyle,
};

export function freshPersisted(clientId: string, nowIso: string, defaults: Pick<Persisted, "timer" | "locationId" | "visited">): Persisted {
  return {
    schema: 5,
    clientId,
    createdAt: nowIso,
    name: null,
    settings: { muted: false, volumes: { ...DEFAULT_VOLUMES }, ambienceMix: {}, ...DEFAULT_PREFERENCES },
    mission: null,
    todos: [],
    nextTodoId: 1,
    timer: defaults.timer,
    locationId: defaults.locationId,
    visited: defaults.visited,
    events: [],
    studiedDays: [],
    unreadThreads: [],
    story: {},
    stamps: { settings: nowIso, mission: nowIso, todos: nowIso },
  };
}
