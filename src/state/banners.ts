import { morgana, sojiro, ui } from "@/content/copy";
import { derive } from "./derive";
import type { AppState } from "./store";

export interface BannerMessage {
  id: string;
  text: string;
}

/**
 * Which transient banners a state change deserves (spec §3.6: greetings, Knowledge and unlock notices). Pure.
 * - nothing at load (prev === next) and no welcome on a first visit (the door bell is that moment);
 * - the unlock notice is Ares's own line, VERBATIM; the dev panel's "unlock all" never triggers it.
 */
export function bannersFor(prev: AppState, next: AppState): BannerMessage[] {
  if (prev === next) return [];
  const out: BannerMessage[] = [];

  // No greeting on a first visit, in demo, or when the save was lost or cannot be kept ("you're back" would contradict that).
  if (!prev.entered && next.entered && !next.firstVisit && !next.demo && !next.recovered && !next.storageBlocked) out.push({ id: "back", text: sojiro.back });

  const before = derive(prev);
  const after = derive(next);
  const gained = after.knowledge - before.knowledge;
  if (gained > 0) out.push({ id: `knowledge-${after.knowledge}`, text: ui.banner.knowledge(gained) });
  if (after.level > before.level) out.push({ id: `level-${after.level}`, text: ui.banner.level(after.level) });

  const newlyUnlocked = after.unlocked.filter((id) => !before.unlocked.includes(id));
  if (newlyUnlocked.length > 0 && prev.devUnlockAll === next.devUnlockAll) out.push({ id: `unlock-${newlyUnlocked.join(",")}`, text: morgana.newLocation });
  return out;
}
