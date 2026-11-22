import { HUD_SIZES, TOGGLEABLE_WIDGETS, type HudSize, type WidgetId } from "@/hud/slots";
import { DEFAULT_PREFERENCES, DEFAULT_VOLUMES, type MotionSetting, type Persisted, type Volumes } from "./schema";

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
  };
}

/** A stored deadline that is not a readable date is dropped; the mission itself is kept. */
export function repairDeadline(deadline: unknown): string | null {
  return typeof deadline === "string" && !Number.isNaN(Date.parse(deadline)) ? deadline : null;
}
