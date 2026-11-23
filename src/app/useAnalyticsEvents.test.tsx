import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initialState, type Action } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { setSender, type EventName, type EventProps } from "./analytics";
import { setAnalyticsAllowed } from "./telemetry";
import { useAnalyticsEvents } from "./useAnalyticsEvents";

const sent: { name: EventName; props: EventProps }[] = [];
beforeEach(() => { sent.length = 0; setAnalyticsAllowed(true); setSender((name, props) => { sent.push({ name, props }); }); });
afterEach(() => setAnalyticsAllowed(true));

function setup(enabled: boolean, state = {}) {
  let send!: (a: Action) => void;
  function Probe() { const s = useStore(); useEffect(() => { send = s.dispatch; }); useAnalyticsEvents(enabled); return null; }
  render(<StoreProvider initial={{ ...initialState, layer: "main", entered: true, ...state }}><Probe /></StoreProvider>);
  return (a: Action) => act(() => send(a));
}

describe("useAnalyticsEvents", () => {
  it("sends nothing at load, and the events of what the player then does", () => {
    const dispatch = setup(true);
    expect(sent).toEqual([]);
    dispatch({ type: "START_SESSION", now: 0 });
    expect(sent).toEqual([{ name: "session_started", props: { location: "leblanc", plannedMin: 25 } }]);
    dispatch({ type: "SET_MISSION", text: "A private mission" });
    expect(sent.map((e) => e.name)).toEqual(["session_started", "mission_set"]);
    expect(JSON.stringify(sent)).not.toContain("private");
  });

  it("sends nothing when it is off (dev mode), however much happens", () => {
    const dispatch = setup(false);
    dispatch({ type: "START_SESSION", now: 0 });
    dispatch({ type: "SET_MISSION", text: "x" });
    expect(sent).toEqual([]);
  });

  it("sends nothing in the demo", () => {
    const dispatch = setup(true, { demo: true });
    dispatch({ type: "START_SESSION", now: 0 });
    expect(sent).toEqual([]);
  });

  it("sends nothing once the player has switched analytics off in Settings", () => {
    const dispatch = setup(true);
    dispatch({ type: "SET_ANALYTICS", on: false });
    setAnalyticsAllowed(false); // what Preferences does when the switch changes
    dispatch({ type: "START_SESSION", now: 0 });
    expect(sent).toEqual([]);
  });
});
