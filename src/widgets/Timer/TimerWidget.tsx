import { useEffect } from "react";
import { Pause, Play, Stop } from "@phosphor-icons/react";
import { TimerDisplay, TimerIcon, TimerRoot } from "@/components/ui/timer";
import { useNow } from "@/hooks/useNow";
import { formatClock, MINUTE, remainingMs, type TimerEvent } from "@/domain/timer";
import { useStore } from "@/state/StoreProvider";
import { Slab } from "../Slab";

const DURATIONS = [10, 25, 30] as const;

/** Focus timer. State lives in the store; this dispatches events and shows time derived from `now`. */
export function TimerWidget() {
  const { state, dispatch } = useStore();
  const now = useNow(250);
  const timer = state.timer;
  const send = (event: TimerEvent) => dispatch({ type: "TIMER", event, now: Date.now() });

  // One TICK once the end passes; the reducer turns it into a completed session.
  useEffect(() => {
    if (timer.status === "running" && now >= timer.endsAt) dispatch({ type: "TIMER", event: { type: "TICK", now }, now });
  }, [timer, now, dispatch]);

  return (
    <Slab className="flex h-full w-full items-center justify-between gap-2 px-1" label="Timer">
      <TimerRoot className="border-0 px-1" data-status={timer.status}>
        <TimerIcon running={timer.status === "running"} />
        <TimerDisplay time={formatClock(remainingMs(timer, now))} className="font-hud-timer text-4xl leading-none" />
      </TimerRoot>
      <div className="flex items-center gap-1">
        {timer.status === "idle" && (
          <>
            <select
              aria-label="Session length"
              className="border border-white bg-black px-1 text-sm"
              value={timer.durationMs / MINUTE}
              onChange={(e) => send({ type: "SET_DURATION", durationMs: Number(e.target.value) * MINUTE })}
            >
              {DURATIONS.map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
            <IconButton label="Start" onClick={() => send({ type: "START", now: Date.now() })}><Play weight="fill" /></IconButton>
          </>
        )}
        {timer.status === "running" && (
          <>
            <IconButton label="Pause" onClick={() => send({ type: "PAUSE", now: Date.now() })}><Pause weight="fill" /></IconButton>
            <IconButton label="Stop" onClick={() => send({ type: "STOP" })}><Stop weight="fill" /></IconButton>
          </>
        )}
        {timer.status === "complete" && (
          <IconButton label="Start" onClick={() => dispatch({ type: "START_SESSION", now: Date.now() })}><Play weight="fill" /></IconButton>
        )}
        {timer.status === "paused" && (
          <>
            <IconButton label="Resume" onClick={() => send({ type: "RESUME", now: Date.now() })}><Play weight="fill" /></IconButton>
            <IconButton label="Stop" onClick={() => send({ type: "STOP" })}><Stop weight="fill" /></IconButton>
          </>
        )}
      </div>
    </Slab>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-7 place-items-center border border-white bg-redbright text-white hover:bg-white hover:text-redbright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentteal">
      {children}
    </button>
  );
}
