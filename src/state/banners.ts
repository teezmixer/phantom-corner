import { levelRewards, morgana, sojiro, ui } from "@/content/copy";
import { LEVEL_REWARDS } from "@/content/progression";
import { getLocation } from "@/content/registry";
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
  if (after.level > before.level) {
    out.push({ id: `level-${after.level}`, text: ui.banner.level(after.level) });
    // Every level gives something (spec §3.4). Locations have their own notice below; the dev panel's grants still count here.
    for (let level = before.level + 1; level <= after.level; level++) {
      const text = LEVEL_REWARDS[level]?.kind === "unlock" ? undefined : levelRewards[level];
      if (text) out.push({ id: `reward-${level}`, text });
    }
  }

  // The mission is ticked done: a small moment of its own (the sound is in audio/triggers.ts).
  if (!prev.missionDone && next.missionDone && prev.mission === next.mission) out.push({ id: `mission-done-${next.missionsDone}`, text: ui.banner.missionDone });
  // A break that ran out (a skipped one says nothing).
  if (prev.lastBreak !== "ended" && next.lastBreak === "ended") out.push({ id: `break-over-${before.sessions}-${next.missionsDone}`, text: ui.banner.breakOver });

  const newlyUnlocked = after.unlocked.filter((id) => !before.unlocked.includes(id));
  if (newlyUnlocked.length > 0 && prev.devUnlockAll === next.devUnlockAll) out.push({ id: `unlock-${newlyUnlocked.join(",")}`, text: morgana.newLocation });
  // A session starts: the place says one line (spec §3.3 "start" lines), a different one each time.
  const started = prev.timer.status !== "running" && prev.timer.status !== "paused" && next.timer.status === "running";
  if (started && next.entered && !next.demo) {
    const lines = getLocation(next.locationId).lines.start;
    out.push({ id: `start-${before.sessions}`, text: lines[before.sessions % lines.length]! });
  }
  // The place says an idle line after a while of idling in the room (spec §3.3 "idle" lines), a different one each time.
  if (!prev.idleSaid && next.idleSaid) {
    const lines = getLocation(next.locationId).lines.idle;
    out.push({ id: `idle-${before.sessions + next.visited.length}`, text: lines[(before.sessions + next.visited.length) % lines.length]! });
  }
  // A first arrival somewhere with no character thread of its own (the bonus places): its arrival line. Characters' arrival
  // exchanges play in their phone thread.
  for (const id of next.visited.filter((v) => !prev.visited.includes(v))) {
    const place = getLocation(id);
    if (!place.threads.arrival && next.entered) out.push({ id: `arrive-${id}`, text: place.lines.arrive[0]! });
  }
  // A level whose location is not ready yet: nothing unlocks, but someone has been asking (spec §3.4).
  const newlyHeld = after.held.filter((id) => !before.held.includes(id));
  if (newlyHeld.length > 0 && prev.devUnlockAll === next.devUnlockAll) out.push({ id: `held-${newlyHeld.join(",")}`, text: morgana.someoneAsking });
  return out;
}
