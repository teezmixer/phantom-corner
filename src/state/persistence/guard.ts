import type { Persisted } from "./schema";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

function isTimer(v: unknown): boolean {
  if (!isRec(v) || !isNum(v.durationMs)) return false;
  switch (v.status) {
    case "idle":
    case "complete":
      return true;
    case "running":
      return isNum(v.endsAt);
    case "paused":
      return isNum(v.remainingMs);
    default:
      return false;
  }
}

function isEvent(v: unknown): boolean {
  if (!isRec(v)) return false;
  if (v.kind === "mission_first_set") return true;
  if (v.kind === "dev_grant") return isNum(v.knowledge);
  if (v.kind === "session") return isNum(v.plannedMs) && isNum(v.focusedMs) && (v.outcome === "completed" || v.outcome === "stopped");
  return false;
}

/** Hand-written shape check (spec §4.2): data from storage is untrusted, so every field is verified. */
export function isPersisted(v: unknown): v is Persisted {
  if (!isRec(v) || v.schema !== 1) return false;
  const { settings, mission, stamps } = v;
  return (
    isStr(v.clientId) &&
    (v.name === null || isStr(v.name)) &&
    isRec(settings) && isBool(settings.muted) &&
    (mission === null || (isRec(mission) && isStr(mission.text) && isStr(mission.setAt) && isBool(mission.done))) &&
    Array.isArray(v.todos) && v.todos.every((t) => isRec(t) && isNum(t.id) && isStr(t.text) && isBool(t.done)) &&
    isNum(v.nextTodoId) &&
    isTimer(v.timer) &&
    isStr(v.locationId) &&
    isStrArray(v.visited) &&
    Array.isArray(v.events) && v.events.every(isEvent) &&
    isStrArray(v.unreadThreads) &&
    isRec(stamps) && isStr(stamps.settings) && isStr(stamps.mission) && isStr(stamps.todos)
  );
}
