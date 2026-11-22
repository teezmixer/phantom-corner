import type { ProgressEvent } from "@/domain/progress";
import type { TimerState } from "@/domain/timer";

/** The one storage key (spec §4.7). `v1` is the key's generation, not the schema version inside it. */
export const STORAGE_KEY = "pc:v1";
export const CURRENT_SCHEMA = 2;

/** Volumes per sound bus, 0–1. Music is the YouTube player's own volume; ambience and interface go through Web Audio. */
export interface Volumes { music: number; ambience: number; ui: number }

/** What is written to storage (schema 2; schema 1 had `settings: { muted }` only — see migrate.ts). UI state — layer, open phone, hidden HUD — is never persisted. */
export interface Persisted {
  schema: 2;
  /** Random id generated on first run; used by sync later (M11). */
  clientId: string;
  name: string | null;
  settings: { muted: boolean; volumes: Volumes; /** Per-ambience-layer level, 0–1 (layer id → level). */ ambienceMix: Record<string, number> };
  mission: { text: string; setAt: string; done: boolean } | null;
  todos: { id: number; text: string; done: boolean }[];
  nextTodoId: number;
  timer: TimerState;
  locationId: string;
  visited: string[];
  events: ProgressEvent[];
  unreadThreads: string[];
  /** Last-changed times per slice, used by sync to pick the newer side (M11). */
  stamps: { settings: string; mission: string; todos: string };
}

/** PROVISIONAL defaults (decision D-25): quiet ambience, UI sounds clearly audible, music at half. */
export const DEFAULT_VOLUMES: Volumes = { music: 0.5, ambience: 0.35, ui: 0.7 };

export function freshPersisted(clientId: string, nowIso: string, defaults: Pick<Persisted, "timer" | "locationId" | "visited">): Persisted {
  return {
    schema: 2,
    clientId,
    name: null,
    settings: { muted: false, volumes: { ...DEFAULT_VOLUMES }, ambienceMix: {} },
    mission: null,
    todos: [],
    nextTodoId: 1,
    timer: defaults.timer,
    locationId: defaults.locationId,
    visited: defaults.visited,
    events: [],
    unreadThreads: [],
    stamps: { settings: nowIso, mission: nowIso, todos: nowIso },
  };
}
