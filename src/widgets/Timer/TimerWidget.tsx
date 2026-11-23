import { useState } from "react";
import { Pause, Play, Stop } from "@phosphor-icons/react";
import { TimerDisplay, TimerIcon, TimerRoot } from "@/components/ui/timer";
import { useNow } from "@/hooks/useNow";
import { clampCustomMinutes, formatClock, timerAnnouncement, MAX_CUSTOM_MINUTES, MIN_CUSTOM_MINUTES, MINUTE, remainingMs, type TimerEvent } from "@/domain/timer";
import { useStore } from "@/state/StoreProvider";
import { Slab } from "../Slab";

const DURATIONS = [10, 25, 30] as const;

/** Focus timer. State lives in the store; this dispatches events and shows time derived from `now`. */
export function TimerWidget() {
  const { state, dispatch } = useStore();
  const now = useNow(250);
  const timer = state.timer;
  const minutes = Math.round(timer.durationMs / MINUTE);
  const [custom, setCustom] = useState(!(DURATIONS as readonly number[]).includes(minutes));
  const send = (event: TimerEvent) => dispatch({ type: "TIMER", event, now: Date.now() });

  return (
    <Slab className="flex h-full w-full items-center justify-between gap-2 px-1" label="Timer">
      <TimerRoot className="border-0 px-1" data-status={timer.status}>
        <TimerIcon />
        <TimerDisplay time={formatClock(remainingMs(timer, now))} className="font-hud-timer text-3xl leading-none" />
      </TimerRoot>
      {/* The clock above ticks every second and is not read out; this says the time left only every five minutes (spec §4.12). */}
      <span role="status" aria-live="polite" className="sr-only">{timerAnnouncement(timer, now)}</span>
      <div className="flex items-center gap-1">
        {timer.status === "idle" && (
          <>
            <select
              aria-label="Session length"
              className="border border-white bg-black px-1 text-sm"
              value={custom ? "custom" : minutes}
              onChange={(e) => {
                if (e.target.value === "custom") { setCustom(true); return; }
                setCustom(false);
                send({ type: "SET_DURATION", durationMs: Number(e.target.value) * MINUTE });
              }}
            >
              {DURATIONS.map((m) => <option key={m} value={m}>{m} min</option>)}
              <option value="custom">Custom</option>
            </select>
            {custom && (
              <input
                type="number"
                aria-label="Custom session length in minutes"
                min={MIN_CUSTOM_MINUTES}
                max={MAX_CUSTOM_MINUTES}
                defaultValue={minutes}
                onBlur={(e) => {
                  const clamped = clampCustomMinutes(e.target.valueAsNumber);
                  e.target.value = String(clamped);
                  send({ type: "SET_DURATION", durationMs: clamped * MINUTE });
                }}
                className="w-12 border border-white bg-black px-1 text-sm"
              />
            )}
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
