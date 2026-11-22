import { useEffect } from "react";
import { getLocation } from "@/content/registry";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useStore } from "@/state/StoreProvider";

/** Provisional hold (spec §3.10: travel 1.2–1.6 s). The wipe, preload and sign settling arrive in M9. */
export const TRAVEL_HOLD_MS = 1400;

/** Title card shown while travelling. Reduced motion shortens the hold to a cut. */
export function TravelScreen() {
  const { state, dispatch } = useStore();
  const reduced = useReducedMotion();
  const target = state.travelTo ? getLocation(state.travelTo) : null;

  useEffect(() => {
    const id = setTimeout(() => dispatch({ type: "ARRIVE" }), reduced ? 100 : TRAVEL_HOLD_MS);
    return () => clearTimeout(id);
  }, [dispatch, reduced]);

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black text-white">
      <p className="font-display-hero text-6xl">{target?.name ?? "…"}</p>
      <p className="font-body-primary text-greylight">{target?.register}</p>
    </div>
  );
}
