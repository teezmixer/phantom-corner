import { Television } from "@phosphor-icons/react";

/**
 * Where the YouTube TV will sit (M4). Outside the scaled corner groups so its CSS size never drops below 200x200
 * (spec §4.8), and always visible — Hide UI never hides it. Placement is provisional: DECISION: tv-placement (D-05).
 * Vertically centred on the right, which clears the todo slot above and the location sign below at 1024x600 and up.
 */
export function TvPlaceholder({ scale }: { scale: number }) {
  return (
    <section
      aria-label="TV (placeholder)"
      className="pointer-events-auto absolute top-1/2 z-10 flex h-[200px] w-[200px] -translate-y-1/2 flex-col items-center justify-center gap-2 border-2 border-white bg-black font-body-primary text-white"
      style={{ right: 39 * scale }}
    >
      <Television size={64} aria-hidden="true" />
      <p className="px-2 text-center text-sm">TV — the player arrives with the audio milestone</p>
    </section>
  );
}
