import type { ProgressEvent } from "@/domain/progress";
import type { TimerState } from "@/domain/timer";

/** The one storage key (spec §4.7). `v1` is the key's generation, not the schema version inside it. */
export const STORAGE_KEY = "pc:v1";
export const CURRENT_SCHEMA = 1;

/** What is written to storage (schema 1). UI state — layer, open phone, hidden HUD — is never persisted. */
export interface Persisted {
  schema: 1;
  /** Random id generated on first run; used by sync later (M11). */
  clientId: string;
  name: string | null;
  settings: { muted: boolean };
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

export function freshPersisted(clientId: string, nowIso: string, defaults: Pick<Persisted, "timer" | "locationId" | "visited">): Persisted {
  return {
    schema: 1,
    clientId,
    name: null,
    settings: { muted: false },
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
