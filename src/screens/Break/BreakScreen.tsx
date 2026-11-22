import { useEffect } from "react";
import { Coffee } from "@phosphor-icons/react";
import { sessionEnd } from "@/content/copy";
import { formatClock } from "@/domain/timer";
import { useNow } from "@/hooks/useNow";
import { useStore } from "@/state/StoreProvider";
import { Overlay, buttonClass } from "../Overlay";

/** Take five: a short break timer. At zero it returns to the choice; "Back to it" starts the next session now. */
export function BreakScreen() {
  const { state, dispatch } = useStore();
  const now = useNow(250);
  const left = Math.max(0, (state.breakEndsAt ?? now) - now);
  useEffect(() => {
    if (state.breakEndsAt !== null && now >= state.breakEndsAt) dispatch({ type: "END_BREAK" });
  }, [now, state.breakEndsAt, dispatch]);
  return (
    <Overlay title={sessionEnd.breakHeading} closable={false}>
      <div className="flex items-center gap-4"><Coffee size={48} aria-hidden="true" /><p role="timer" className="font-hud-timer text-6xl tabular-nums">{formatClock(left)}</p></div>
      <button type="button" onClick={() => dispatch({ type: "START_SESSION", now: Date.now() })} className={buttonClass}>{sessionEnd.breakBack}</button>
    </Overlay>
  );
}
