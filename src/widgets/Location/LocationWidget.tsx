import { useEffect } from "react";
import { MapPin } from "@phosphor-icons/react";
import { getLocation } from "@/content/registry";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { motion } from "@/motion/tokens";
import { useStore } from "@/state/StoreProvider";

type LocationWidgetProps = {
  locationId: string;
  className?: string;
};

/**
 * The location sign. Until Ares's drawn signs return (D-21), it is a Phosphor map pin plus the place name in the
 * display face — the spec's own fallback for a location without sign art (§3.6).
 * On a first arrival it comes in BIG, holds (`hold`, 900 ms), and settles into its corner (spec §3.6, §3.10); the move is a
 * transform only. With reduced motion it is settled at once. DECISION: D-33 — how big, and where it holds, are placeholders.
 */
export const LocationWidget = ({ locationId, className = "" }: LocationWidgetProps): React.JSX.Element => {
  const location = getLocation(locationId);
  const { state, dispatch } = useStore();
  const reduced = useReducedMotion();
  const arriving = state.signArriving && !reduced;
  // The hold starts when the room is in view (not while the travel card still covers it) and ends in the corner.
  const inRoom = state.layer === "main";
  useEffect(() => {
    if (!state.signArriving || !inRoom) return;
    const id = setTimeout(() => dispatch({ type: "SIGN_SETTLED" }), reduced ? 0 : motion.hold);
    return () => clearTimeout(id);
  }, [state.signArriving, inRoom, reduced, dispatch]);

  return (
    <div
      data-sign={arriving ? "arriving" : "settled"}
      className={`pointer-events-auto relative flex origin-bottom-right items-center justify-end gap-3 text-white ${arriving ? "z-20" : ""} ${className}`}
      style={{ transform: arriving ? "translateX(-3rem) scale(2.4)" : "none", transition: reduced ? "none" : "transform var(--motion-enter) var(--motion-enter-easing)" }}
      aria-label={`Current location: ${location.name}`}
    >
      <MapPin size={48} weight="fill" className="shrink-0 text-redbright" aria-hidden="true" />
      <span className="border-2 border-white bg-black px-4 py-2 font-display-hero text-5xl leading-none [text-shadow:none]">{location.name}</span>
    </div>
  );
};

export default LocationWidget;
