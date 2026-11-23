import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialState, type Action, type AppState } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { SummaryScreen } from "./SummaryScreen";

const NOON = new Date(2026, 10, 23, 12).getTime();

function setup(start: Partial<AppState> = {}) {
  let dispatch!: (a: Action) => void;
  function Grab() { const s = useStore(); useEffect(() => { dispatch = s.dispatch; }); return null; }
  render(<StoreProvider initial={{ ...initialState, entered: true, layer: "summary", ...start }}><Grab /><SummaryScreen /></StoreProvider>);
  return (a: Action) => act(() => dispatch(a));
}

describe("SummaryScreen calendar", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOON); });
  afterEach(() => vi.useRealTimers());

  it("after a finished session today is stamped, and the calendar shows it", () => {
    const send = setup({ layer: "main" });
    send({ type: "START_SESSION", now: NOON });
    send({ type: "TIMER", event: { type: "TICK", now: NOON + 25 * 60_000 }, now: NOON + 25 * 60_000 });
    send({ type: "SET_LAYER", layer: "summary" });
    expect(screen.getByText("Today is stamped.")).toBeInTheDocument();
    expect(document.querySelector('[data-day="2026-11-23"]')).toHaveAttribute("data-stamp");
  });

  it("does not claim today is stamped after a session too short to count", () => {
    const send = setup({ layer: "main" });
    send({ type: "START_SESSION", now: NOON });
    send({ type: "TIMER", event: { type: "STOP" }, now: NOON + 3 * 60_000 }); // three minutes: counts for nothing
    expect(screen.queryByText("Today is stamped.")).toBeNull();
    expect(document.querySelectorAll("[data-stamp]")).toHaveLength(0);
  });

  it("shows earlier days that were studied too", () => {
    setup({ studiedDays: [{ day: "2026-11-02", style: 0 }, { day: "2026-11-23", style: 0 }] });
    expect([...document.querySelectorAll("[data-stamp]")].map((c) => c.getAttribute("data-day"))).toEqual(["2026-11-02", "2026-11-23"]);
    expect(screen.getByText("Today is stamped.")).toBeInTheDocument();
  });
});
