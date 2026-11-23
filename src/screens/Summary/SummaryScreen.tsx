import { useState } from "react";
import { Calendar, Copy, DownloadSimple } from "@phosphor-icons/react";
import { StampCalendar } from "@/components/StampCalendar";
import { dayKey } from "@/domain/calendar";
import { RollingNumber } from "@/components/ui/rolling-number";
import { sessionEnd, ui } from "@/content/copy";
import { getLocation } from "@/content/registry";
import { knowledgeFor } from "@/domain/progress";
import { shareCardLines } from "@/domain/shareCard";
import { useStore } from "@/state/StoreProvider";
import { Overlay, buttonClass } from "../Overlay";
import { canCopyImage, copyShareCard, saveShareCard } from "./shareCardImage";

/**
 * Session summary: minutes focused, Knowledge gained (counts up), mission echo, one character line, calendar stamp,
 * continue or finish (spec §3.6), and a shareable card with no personal text (spec §5).
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
  const [cardMessage, setCardMessage] = useState("");
  const share = (make: typeof saveShareCard, said = false) =>
    make(shareCardLines({ minutes, knowledge: gained, location: getLocation(state.locationId).name })).then(() => setCardMessage(said ? sessionEnd.shareCardCopied : ""), () => setCardMessage(sessionEnd.shareCardFailed));
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
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => dispatch({ type: "START_SESSION", now: Date.now() })} className={buttonClass}>{sessionEnd.summaryContinue}</button>
        <button type="button" onClick={() => dispatch({ type: "FINISH" })} className={buttonClass}>{sessionEnd.summaryFinish}</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => share(saveShareCard)} className={`${buttonClass} flex items-center justify-center gap-2 text-sm`}>
          <DownloadSimple size={18} aria-hidden="true" />{sessionEnd.shareCard}
        </button>
        {canCopyImage() && (
          <button type="button" onClick={() => share(copyShareCard, true)} className={`${buttonClass} flex items-center justify-center gap-2 text-sm`}>
            <Copy size={18} aria-hidden="true" />{sessionEnd.shareCardCopy}
          </button>
        )}
      </div>
      {cardMessage && <p role="status" className="text-sm text-greylight">{cardMessage}</p>}
      {/* After the buttons, so the choices never sit below the fold on a small window. */}
      <StampCalendar days={state.studiedDays} now={now} />
    </Overlay>
  );
}
