import { MAX_EVENTS } from "@/domain/limits";
import { MAX_CUSTOM_MINUTES, MINUTE } from "@/domain/timer";
import type { Persisted } from "./schema";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

/** Hard ceiling on small lists in storage; todos above MAX_TODOS are cut on load, anything absurdly larger is refused. */
const MAX_STORED_ITEMS = 5000;
const MAX_DURATION = MAX_CUSTOM_MINUTES * MINUTE;
const DAY = 24 * 60 * MINUTE;

function isTimer(v: unknown): boolean {
  if (!isRec(v) || !isNum(v.durationMs) || v.durationMs <= 0 || v.durationMs > MAX_DURATION) return false;
  switch (v.status) {
    case "idle":
    case "complete":
      return true;
    case "running":
      return isNum(v.endsAt);
    case "paused":
      return isNum(v.remainingMs) && v.remainingMs >= 0 && v.remainingMs <= v.durationMs;
    default:
      return false;
  }
}

/** One event is valid. Exported so the loader can DROP a bad event and keep the rest instead of resetting everything. */
export function isEvent(v: unknown): boolean {
  if (!isRec(v)) return false;
  if (v.kind === "mission_first_set") return true;
  if (v.kind === "dev_grant") return isNum(v.knowledge) && v.knowledge >= 0 && v.knowledge <= 1_000_000;
  if (v.kind === "session") {
    // Focused time is never negative and never longer than the session (1 s of rounding slack).
    return isNum(v.plannedMs) && v.plannedMs > 0 && v.plannedMs <= DAY && isNum(v.focusedMs) && v.focusedMs >= 0 && v.focusedMs <= v.plannedMs + 1000 && (v.outcome === "completed" || v.outcome === "stopped");
  }
  return false;
}

/** Hand-written shape check (spec §4.2): data from storage is untrusted, so every field is verified. */
export function isPersisted(v: unknown): v is Persisted {
  if (!isRec(v) || v.schema !== 3) return false;
  const { settings, mission, stamps } = v;
  return (
    isStr(v.clientId) &&
    (v.name === null || isStr(v.name)) &&
    isRec(settings) && (!isRec(settings.ambienceMix) || Object.keys(settings.ambienceMix).length <= 200) && // every field inside is defaulted or clamped by repairSettings, so one bad preference never discards a save
    
    (mission === null || (isRec(mission) && isStr(mission.text) && isStr(mission.setAt) && isBool(mission.done) && (mission.deadline === undefined || isStr(mission.deadline)))) &&
    Array.isArray(v.todos) && v.todos.length <= MAX_STORED_ITEMS && v.todos.every((t) => isRec(t) && isNum(t.id) && isStr(t.text) && isBool(t.done)) &&
    isNum(v.nextTodoId) && Number.isInteger(v.nextTodoId) && v.nextTodoId >= 1 &&
    isTimer(v.timer) &&
    isStr(v.locationId) &&
    isStrArray(v.visited) && v.visited.length <= MAX_STORED_ITEMS &&
    // Events are only checked to be a bounded array here: a single impossible event is dropped on load (mapping),
    // so one bad record never costs the user their whole history.
    Array.isArray(v.events) && v.events.length <= MAX_EVENTS &&
    isStrArray(v.unreadThreads) && v.unreadThreads.length <= MAX_STORED_ITEMS &&
    isRec(stamps) && isStr(stamps.settings) && isStr(stamps.mission) && isStr(stamps.todos)
  );
}
