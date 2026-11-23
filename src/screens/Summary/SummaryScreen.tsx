import { useState } from "react";
import { Calendar } from "@phosphor-icons/react";
import { StampCalendar } from "@/components/StampCalendar";
import { dayKey } from "@/domain/calendar";
import { RollingNumber } from "@/components/ui/rolling-number";
import { sessionEnd, ui } from "@/content/copy";
import { getLocation } from "@/content/registry";
import { knowledgeFor } from "@/domain/progress";
import { useStore } from "@/state/StoreProvider";
import { Overlay, buttonClass } from "../Overlay";

/**
 * Session summary: minutes focused, Knowledge gained (counts up), mission echo, one character line, calendar stamp,
 * continue or finish (spec §3.6). Share card arrives in M10.
 */
export function SummaryScreen() {
  const { state, dispatch } = useStore();
  const lastIndex = state.events.map((e) => e.kind).lastIndexOf("session");
  const last = lastIndex >= 0 ? state.events[lastIndex] : undefined;
  const session = last?.kind === "session" ? last : undefined;
  const minutes = session ? Math.floor(session.focusedMs / 60_000) : 0;
  const gained = lastIndex >= 0 ? knowledgeFor(state.events.slice(0, lastIndex + 1)) - knowledgeFor(state.events.slice(0, lastIndex)) : 0;
  const [now] = useState(() => Date.now()); // read once when the summary opens, so the screen cannot change under the player
  const lines = getLocation(state.locationId).lines.complete;
  const line = lines[(lastIndex >= 0 ? lastIndex : 0) % lines.length];

  return (
    <Overlay title="Session complete" closable={false}>
      <dl className="grid grid-cols-2 gap-2">
        <div className="border border-white p-3"><dt className="text-xs text-greylight">Minutes focused</dt><dd className="font-display-hero text-5xl leading-none">{minutes}</dd></div>
        <div className="border border-white p-3"><dt className="text-xs text-greylight">Knowledge</dt><dd className="font-display-hero text-5xl leading-none">+<RollingNumber value={gained} /></dd></div>
      </dl>
      {state.mission && <p className="border-l-4 border-redbright pl-3">Mission: {state.mission}</p>}
      <p className="font-body-primary text-2xl">{line}</p>
      {/* Only said when today really was stamped: a session cut short under five minutes counts for nothing, and the screen must not claim otherwise. */}
      {state.studiedDays.some((d) => d.day === dayKey(now)) && <p className="flex items-center gap-2 text-sm text-greylight"><Calendar size={18} aria-hidden="true" />{ui.stamped}</p>}
      <StampCalendar days={state.studiedDays} now={now} />
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => dispatch({ type: "START_SESSION", now: Date.now() })} className={buttonClass}>{sessionEnd.summaryContinue}</button>
        <button type="button" onClick={() => dispatch({ type: "FINISH" })} className={buttonClass}>{sessionEnd.summaryFinish}</button>
      </div>
    </Overlay>
  );
}
