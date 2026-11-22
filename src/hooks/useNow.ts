import { useEffect, useState } from "react";

/** Current time in ms, refreshed every `intervalMs`. Components derive what they show from this. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    // Hidden tabs throttle timers heavily, so recompute the moment the tab is visible again (spec §4.5).
    const onVisible = () => { if (document.visibilityState === "visible") setNow(Date.now()); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [intervalMs]);
  return now;
}
