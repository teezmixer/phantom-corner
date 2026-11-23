import { THREADS } from "@/content/threads";
import { MAX_MESSAGES, type Message, type ThreadProgress } from "@/domain/story";
import { HUD_SIZES, TOGGLEABLE_WIDGETS, type HudSize, type WidgetId } from "@/hud/slots";
import { DEFAULT_PREFERENCES, DEFAULT_VOLUMES, type MenuStyle, type MotionSetting, type Persisted, type Volumes } from "./schema";

const isRec = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const unit = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);

/**
 * Repair what is recoverable in saved settings instead of refusing the whole save (the M3 principle: one bad value must
 * never cost someone their progress). Every field falls back to its default; out-of-range volumes are clamped; ids that
 * may not be hidden (the TV, the button bar, anything unknown) are dropped.
 */
export function repairSettings(raw: unknown): Persisted["settings"] {
  const s = isRec(raw) ? raw : {};
  const volumes = isRec(s.volumes) ? s.volumes : {};
  const v: Volumes = {
    music: unit(volumes.music) ?? DEFAULT_VOLUMES.music,
    ambience: unit(volumes.ambience) ?? DEFAULT_VOLUMES.ambience,
    ui: unit(volumes.ui) ?? DEFAULT_VOLUMES.ui,
  };
  const mix: Record<string, number> = {};
  if (isRec(s.ambienceMix)) {
    for (const [id, level] of Object.entries(s.ambienceMix).slice(0, 200)) {
      const clamped = unit(level);
      if (clamped !== null) mix[id] = clamped;
    }
  }
  const hidden = Array.isArray(s.hidden)
    ? [...new Set(s.hidden.filter((id): id is WidgetId => (TOGGLEABLE_WIDGETS as readonly unknown[]).includes(id)))]
    : DEFAULT_PREFERENCES.hidden;
  return {
    muted: typeof s.muted === "boolean" ? s.muted : false,
    volumes: v,
    ambienceMix: mix,
    hidden,
    hudSize: (HUD_SIZES as readonly unknown[]).includes(s.hudSize) ? (s.hudSize as HudSize) : DEFAULT_PREFERENCES.hudSize,
    motion: s.motion === "system" || s.motion === "reduced" ? (s.motion as MotionSetting) : DEFAULT_PREFERENCES.motion,
    analytics: typeof s.analytics === "boolean" ? s.analytics : DEFAULT_PREFERENCES.analytics,
    todoCollapsed: typeof s.todoCollapsed === "boolean" ? s.todoCollapsed : DEFAULT_PREFERENCES.todoCollapsed,
    menuStyle: s.menuStyle === "text" || s.menuStyle === "illustrated" ? (s.menuStyle as MenuStyle) : DEFAULT_PREFERENCES.menuStyle,
  };
}

/** A stored deadline that is not a readable date is dropped; the mission itself is kept. */
export function repairDeadline(deadline: unknown): string | null {
  return typeof deadline === "string" && !Number.isNaN(Date.parse(deadline)) ? deadline : null;
}

/**
 * Saved thread progress, checked against the threads that really exist. A thread is kept when its position is a whole number
 * and its messages are well formed (bad messages are dropped, text is cut); one that is broken beyond that, or that no longer
 * exists, is dropped, which at worst makes a character say their first message again. A finished thread stays finished when
 * the thread's content changes. Never costs the rest of the save.
 */
export function repairStory(raw: unknown): Record<string, ThreadProgress> {
  const out: Record<string, ThreadProgress> = {};
  if (!isRec(raw)) return out;
  for (const thread of THREADS) {
    const saved = raw[thread.id];
    if (!isRec(saved)) continue;
    const { cursor, messages } = saved;
    if (typeof cursor !== "number" || !Number.isInteger(cursor) || cursor < 0) continue;
    // A thread's content can change between builds (Ares's real messages, a new step). A thread the player has finished stays
    // finished, whatever its length is now, so an edit never replays it; a position past the end (the thread got shorter) is the end.
    const finished = !thread.compose && (saved.done === true || cursor >= thread.steps.length);
    const kept: Message[] = [];
    for (const m of Array.isArray(messages) ? messages.slice(-MAX_MESSAGES) : []) {
      if (!isRec(m) || (m.side !== "them" && m.side !== "me") || typeof m.text !== "string" || m.text.trim() === "") continue;
      const delay = typeof m.delayMs === "number" && Number.isFinite(m.delayMs) && m.delayMs > 0 ? Math.min(5000, m.delayMs) : undefined;
      kept.push({ side: m.side, from: typeof m.from === "string" ? m.from.slice(0, 40) : thread.from, text: m.text.slice(0, 500), ...(delay ? { delayMs: delay } : {}) });
    }
    out[thread.id] = { cursor: finished ? thread.steps.length : cursor, messages: kept, done: finished };
  }
  return out;
}
