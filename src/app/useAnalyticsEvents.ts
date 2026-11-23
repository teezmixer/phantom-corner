import { useEffect, useRef } from "react";
import { useStore } from "@/state/StoreProvider";
import { eventsFor, track } from "./analytics";

/**
 * Sends the analytics events each change of state is (see `eventsFor`). Off in the demo and in dev mode: neither is a real visit.
 * Whether anything is actually sent is decided in `track`, at send time, by the Settings switch.
 */
export function useAnalyticsEvents(enabled: boolean): void {
  const { state } = useStore();
  const before = useRef(state);
  useEffect(() => {
    const prev = before.current;
    before.current = state;
    if (!enabled) return;
    for (const event of eventsFor(prev, state)) track(event.name, event.props);
  }, [state, enabled]);
}
