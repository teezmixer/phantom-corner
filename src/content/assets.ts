import type { LocationManifest } from "./types";

/** The image files a place needs on screen, which travel loads inside the title card (spec §4.10). A place with no art yet has none. */
export function imagesOf(place: Pick<LocationManifest, "scene" | "sign">): string[] {
  return [place.scene.poster?.src, place.scene.night?.src, place.sign?.src].filter((src): src is string => typeof src === "string" && src !== "");
}
