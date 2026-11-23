/**
 * Product analytics (spec §4.16): a short, named list of events with a short, named list of properties, sent only while the
 * Settings switch is on, and never any text the player wrote. Nothing here can send a mission or a todo: `track` keeps only four
 * properties and only plain values, whatever it is given.
 */
import { track as vercelTrack } from "@vercel/analytics";
import { derive } from "@/state/derive";
import type { AppState } from "@/state/store";
import { isAnalyticsAllowed } from "./telemetry";

/** The events, exactly as the spec names them. The two save-prompt events wait for accounts (M11), which build the prompt. */
export const EVENT_NAMES = [
  "entered", "session_started", "session_completed", "session_stopped", "mission_set", "music_played",
  "track_unavailable", "location_unlocked", "travelled", "save_prompt_shown", "save_prompt_accepted", "feedback_opened",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

/** The only properties an event may carry: where, how long (planned and focused, in minutes) and how far (level). */
export type EventProps = { location?: string; plannedMin?: number; focusedMin?: number; level?: number };
const KEYS: readonly (keyof EventProps)[] = ["location", "plannedMin", "focusedMin", "level"];
const LOCATION_ID = /^[a-z0-9-]{1,30}$/;

/** Keep only the four properties, and only if they have the right shape: a location id like `ryuji`, or a small whole number. */
export function sanitize(props: Record<string, unknown> | undefined): EventProps {
  const out: EventProps = {};
  if (!props) return out;
  for (const key of KEYS) {
    const value = props[key];
    if (key === "location") { if (typeof value === "string" && LOCATION_ID.test(value)) out.location = value; }
    else if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100_000) out[key] = Math.round(value);
  }
  return out;
}

type Sender = (name: EventName, props: EventProps) => void;
let send: Sender = (name, props) => vercelTrack(name, Object.keys(props).length > 0 ? (props as Record<string, string | number>) : undefined);
/** Swap the sender (tests). */
export function setSender(sender: Sender): void { send = sender; }

/** Send an event: not at all unless the switch is on, never an unknown name, and only the sanitised properties. */
export function track(name: EventName, props?: Record<string, unknown>): void {
  if (!isAnalyticsAllowed()) return;
  if (!EVENT_NAMES.includes(name)) return;
  send(name, sanitize(props));
}

export interface AnalyticsEvent { name: EventName; props: EventProps }

const minutes = (ms: number) => Math.round(ms / 60_000);

/**
 * Which events a change of state is. Pure, so the list is testable. Nothing for the demo, and nothing at load. The text of a
 * mission is read only to see that it changed, and is never put in an event.
 */
export function eventsFor(prev: AppState, next: AppState): AnalyticsEvent[] {
  if (prev === next || next.demo) return [];
  // A sync brings in other devices' history: events with another device's id in them. That is not something this player just did,
  // so it sends nothing (not a session per remote session, not an unlock per place the merged history opens).
  if (next.clientId !== "" && next.events.slice(prev.events.length).some((e) => e.id !== undefined && !e.id.startsWith(`${next.clientId}:`))) return [];
  const level = derive(next).level;
  const location = next.locationId;
  const out: AnalyticsEvent[] = [];

  if (!prev.entered && next.entered) out.push({ name: "entered", props: { location, level } });

  const started = prev.timer.status !== "running" && prev.timer.status !== "paused" && next.timer.status === "running";
  if (started) out.push({ name: "session_started", props: { location, plannedMin: minutes(next.timer.durationMs) } });

  for (const event of next.events.slice(prev.events.length)) {
    if (event.kind !== "session") continue;
    out.push({ name: event.outcome === "completed" ? "session_completed" : "session_stopped", props: { location, plannedMin: minutes(event.plannedMs), focusedMin: minutes(event.focusedMs), level } });
  }

  if (next.mission !== "" && next.mission !== prev.mission) out.push({ name: "mission_set", props: { location, level } });

  if (prev.devUnlockAll === next.devUnlockAll) {
    const before = derive(prev).unlocked;
    for (const id of derive(next).unlocked) if (!before.includes(id)) out.push({ name: "location_unlocked", props: { location: id, level } });
  }

  if (prev.locationId !== next.locationId && next.entered) out.push({ name: "travelled", props: { location: next.locationId } });

  if (prev.phoneThread !== next.phoneThread && next.phoneThread === "feedback") out.push({ name: "feedback_opened", props: { location } });

  return out;
}
