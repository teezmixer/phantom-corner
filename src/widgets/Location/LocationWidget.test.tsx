import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { motion } from "@/motion/tokens";
import { initialState, type Action, type AppState } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import LocationWidget from "./LocationWidget";

const room: AppState = { ...initialState, layer: "main", entered: true };

function show(locationId: string, state: Partial<AppState> = {}) {
  let send!: (a: Action) => void;
  let latest!: AppState;
  function Grab() { const s = useStore(); useEffect(() => { send = s.dispatch; latest = s.state; }); return null; }
  render(<StoreProvider initial={{ ...room, ...state }}><LocationWidget locationId={locationId} /><Grab /></StoreProvider>);
  return { send: (a: Action) => act(() => send(a)), state: () => latest };
}
const sign = () => screen.getByLabelText(/Current location/);

describe("LocationWidget", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("names the current location for assistive tech and sight", () => {
    show("leblanc");
    expect(screen.getByLabelText("Current location: Café Leblanc")).toBeInTheDocument();
    expect(screen.getByText("Café Leblanc")).toBeInTheDocument();
  });

  it("works for any registered location, with no art needed", () => {
    show("ryuji");
    expect(screen.getByText("School rooftop")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("fails loudly for an unknown location", () => {
    expect(() => show("nowhere")).toThrow(/Unknown location/);
  });

  it("is settled in its corner when nothing is arriving", () => {
    show("leblanc");
    expect(sign()).toHaveAttribute("data-sign", "settled");
    expect(sign().style.transform).toBe("none");
  });

  describe("on a first arrival", () => {
    it("comes in big, holds for the hold time, then settles", () => {
      const s = show("leblanc", { signArriving: true });
      expect(sign()).toHaveAttribute("data-sign", "arriving");
      expect(sign().style.transform).toMatch(/scale\(1\.9\)/);
      act(() => { vi.advanceTimersByTime(motion.hold - 1); });
      expect(sign()).toHaveAttribute("data-sign", "arriving"); // still holding
      act(() => { vi.advanceTimersByTime(2); });
      expect(sign()).toHaveAttribute("data-sign", "settled");
      expect(s.state().signArriving).toBe(false);
      expect(sign().style.transform).toBe("none");
    });

    it("moves only by transform, with the motion token's easing", () => {
      show("leblanc", { signArriving: true });
      expect(sign().style.transition).toMatch(/^transform /);
      expect(sign().style.transition).toContain("var(--motion-enter-easing)");
    });

    it("does not start holding while a travel card still covers the room", () => {
      const s = show("ryuji", { signArriving: true, layer: "travel" });
      act(() => { vi.advanceTimersByTime(motion.hold * 3); });
      expect(sign()).toHaveAttribute("data-sign", "arriving"); // the room is not in view yet
      s.send({ type: "SET_LAYER", layer: "main" }); // the card is gone
      act(() => { vi.advanceTimersByTime(motion.hold + 1); });
      expect(sign()).toHaveAttribute("data-sign", "settled");
    });

    it("with reduced motion it is settled at once", () => {
      const s = show("leblanc", { signArriving: true, motion: "reduced" });
      expect(sign()).toHaveAttribute("data-sign", "settled"); // never drawn big
      act(() => { vi.advanceTimersByTime(1); });
      expect(s.state().signArriving).toBe(false);
      expect(sign().style.transition).toBe("none");
    });
  });
});
