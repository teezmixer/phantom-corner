import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialState, type Action } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { Banner, BANNER_MS } from "./Banner";

function setup() {
  let dispatch!: (a: Action) => void;
  function Grab() { const s = useStore(); useEffect(() => { dispatch = s.dispatch; }); return null; }
  render(<StoreProvider initial={{ ...initialState, entered: true, layer: "main" }}><Grab /><Banner /></StoreProvider>);
  return (a: Action) => act(() => dispatch(a));
}
const region = () => screen.getByRole("status");

describe("Banner", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is a polite live region that is in the page before anything is announced", () => {
    setup();
    expect(region()).toHaveAttribute("aria-live", "polite");
    expect(region().textContent).toBe("");
  });

  it("shows a message, then the next one, each for BANNER_MS", () => {
    const send = setup();
    send({ type: "SET_MISSION", text: "Study" }); // +10 Knowledge, then Level 2, then the level's gift (the map)
    expect(region().textContent).toBe("+10 Knowledge");
    act(() => { vi.advanceTimersByTime(BANNER_MS - 1); });
    expect(region().textContent).toBe("+10 Knowledge");
    act(() => { vi.advanceTimersByTime(2); });
    expect(region().textContent).toBe("Level 2");
    act(() => { vi.advanceTimersByTime(BANNER_MS + 1); });
    expect(region().textContent).toBe("Morgana: There's a map now. Don't wander off.");
    act(() => { vi.advanceTimersByTime(BANNER_MS + 1); });
    expect(region().textContent).toBe("");
  });
});
