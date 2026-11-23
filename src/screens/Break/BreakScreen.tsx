import { useEffect } from "react";
import { Coffee } from "@phosphor-icons/react";
import { sessionEnd } from "@/content/copy";
import { formatClock } from "@/domain/timer";
import { useNow } from "@/hooks/useNow";
import { useStore } from "@/state/StoreProvider";
import { BREAK_OPTIONS_MIN } from "@/state/store";
import { Overlay, buttonClass } from "../Overlay";

/**
 * Take five, in depth (spec §3.6): a break timer with a choice of lengths, a way to skip the rest, and a cue when it runs
 * out (a sound and a banner, from the audio and banner rules). At zero it returns to the choice; "Back to it" starts the
 * next session now.
 */
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
      <div role="group" aria-label={sessionEnd.breakLength} className="flex gap-2">
        {BREAK_OPTIONS_MIN.map((m) => (
          <button key={m} type="button" aria-pressed={m === state.breakMinutes} onClick={() => dispatch({ type: "SET_BREAK", now: Date.now(), minutes: m })} className={`${buttonClass} flex-1 text-sm ${m === state.breakMinutes ? "bg-redbright" : ""}`}>{sessionEnd.breakMinutes(m)}</button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => dispatch({ type: "START_SESSION", now: Date.now() })} className={buttonClass}>{sessionEnd.breakBack}</button>
        <button type="button" onClick={() => dispatch({ type: "SKIP_BREAK" })} className={buttonClass}>{sessionEnd.breakSkip}</button>
      </div>
    </Overlay>
  );
}
