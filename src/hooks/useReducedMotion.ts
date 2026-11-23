import { useEffect, useState } from "react";
import { useStore } from "@/state/StoreProvider";

const QUERY = "(prefers-reduced-motion: reduce)";

/** The operating system's request for less motion. */
export function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(QUERY).matches : false));
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * True when motion should be reduced: the user chose "reduced" in Settings, or the operating system asks for it
 * (spec §4.12). Must be used inside the store provider.
 */
export function useReducedMotion(): boolean {
  const system = useSystemReducedMotion();
  const { state } = useStore();
  return state.motion === "reduced" || system;
}
