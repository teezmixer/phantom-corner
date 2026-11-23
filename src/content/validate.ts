import type { ImageRef, LocationManifest } from "./types";

/** The spec's floor for how much a location says in each situation (§4.6). */
export const MIN_LINES_PER_GROUP = 3;
/** A YouTube video id is exactly eleven characters from this alphabet (spec §4.6). */
export const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** What the checks need from a location: its manifest plus the unlock level and bonus flag the registry adds. */
export type CheckedLocation = LocationManifest & { unlockLevel: number; bonus: boolean };

/** A thread as far as the checks care: its id, and which location its trigger names (if any). */
export interface CheckedThread {
  id: string;
  trigger?: { on: string; location?: string };
}

export interface ContentOptions {
  /** Does this image file exist? The real test looks in `public/`; tests of the checker pass a fake. */
  imageExists: (src: string) => boolean;
  /** Every thread that exists (the phone's list now; the story module's definitions from M8). */
  threads?: readonly CheckedThread[];
}

function images(l: CheckedLocation): { where: string; ref: ImageRef }[] {
  const out: { where: string; ref: ImageRef }[] = [];
  if (l.scene.poster) out.push({ where: "scene.poster", ref: l.scene.poster });
  if (l.scene.night) out.push({ where: "scene.night", ref: l.scene.night });
  if (l.sign) out.push({ where: "sign", ref: l.sign });
  return out;
}

/**
 * Everything wrong with the content, as readable sentences (empty when it is all fine). A content test runs this in CI, so
 * a new location that breaks a rule fails the build instead of reaching the map (spec §4.6). Pure: no file or network access
 * of its own.
 */
export function contentProblems(locations: readonly CheckedLocation[], options: ContentOptions): string[] {
  const problems: string[] = [];

  // Two ids collide.
  const seen = new Set<string>();
  for (const l of locations) {
    if (seen.has(l.id)) problems.push(`two locations have the id "${l.id}"`);
    seen.add(l.id);
  }

  // Canon indices have a gap or repeat: they must be 0, 1, 2, … in join order.
  const canon = locations.filter((l) => l.canonIndex !== null).map((l) => l.canonIndex as number).sort((a, b) => a - b);
  canon.forEach((index, i) => { if (index !== i) problems.push(`canon indices are not 0..${canon.length - 1} without gaps (found ${canon.join(", ")})`); });

  // An unlock level is not higher than the previous location's (canon in join order, then bonus locations by level).
  const ordered = [...locations].sort((a, b) => (a.canonIndex ?? 100 + a.unlockLevel) - (b.canonIndex ?? 100 + b.unlockLevel));
  ordered.slice(1).forEach((l, i) => {
    const before = ordered[i]!;
    if (l.unlockLevel <= before.unlockLevel) problems.push(`"${l.id}" unlocks at level ${l.unlockLevel}, which is not higher than "${before.id}" at ${before.unlockLevel}`);
  });

  for (const l of locations) {
    // An image file is missing or has no alt text.
    for (const { where, ref } of images(l)) {
      if (!ref.alt || ref.alt.trim() === "") problems.push(`"${l.id}" ${where} has no alt text`);
      if (!options.imageExists(ref.src)) problems.push(`"${l.id}" ${where} points at ${ref.src}, which does not exist`);
    }

    // A manifest has fewer than three lines in any group (or an empty line).
    for (const [group, lines] of Object.entries(l.lines) as [string, string[]][]) {
      if (lines.length < MIN_LINES_PER_GROUP) problems.push(`"${l.id}" has ${lines.length} ${group} line(s); at least ${MIN_LINES_PER_GROUP} are needed`);
      if (lines.some((line) => line.trim() === "")) problems.push(`"${l.id}" has an empty ${group} line`);
    }

    // A track id isn't eleven characters.
    for (const track of l.playlist) {
      if (!VIDEO_ID.test(track.videoId)) problems.push(`"${l.id}" track "${track.title}" has the id "${track.videoId}", which is not an eleven-character YouTube id`);
    }
  }

  // Thread ids named by manifests are unique, and a thread that names a location names one that exists.
  const claimed = new Map<string, string>();
  for (const l of locations) {
    for (const id of [l.threads.unlock, l.threads.arrival]) {
      if (!id) continue;
      const owner = claimed.get(id);
      if (owner !== undefined) problems.push(`thread "${id}" is claimed by both "${owner}" and "${l.id}"`);
      claimed.set(id, l.id);
    }
  }
  for (const thread of options.threads ?? []) {
    const target = thread.trigger?.location;
    if (target !== undefined && !seen.has(target)) problems.push(`thread "${thread.id}" refers to the location "${target}", which does not exist`);
  }

  return problems;
}
