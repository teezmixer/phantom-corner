import { useEffect } from "react";
import { useStore } from "@/state/StoreProvider";

/** How long each banner stays. The queue itself lives in the store (see state/banners.ts and the reducer). */
export const BANNER_MS = 3500;

/**
 * Shows the first waiting banner and dismisses it after a moment (spec §3.6). Announced politely to screen readers
 * (spec §4.12): the live region is always in the page, so a message that appears later is announced.
 */
export function Banner() {
  const { state, dispatch } = useStore();
  const current = state.banners[0];

  useEffect(() => {
    if (!current) return;
    const id = setTimeout(() => dispatch({ type: "DISMISS_BANNER" }), BANNER_MS);
    return () => clearTimeout(id);
  }, [current, dispatch]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed left-1/2 top-3 z-30 -translate-x-1/2 font-body-primary">
      {current && (
        <p key={current.id} className="border-2 border-white bg-black px-4 py-2 text-lg text-white motion-safe:animate-gate-in">{current.text}</p>
      )}
    </div>
  );
}
