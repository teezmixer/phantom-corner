import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { LOCATIONS } from "@/content/registry";
import { initialState, type AppState } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { MapScreen } from "./MapScreen";

function show(patch: Partial<AppState> = {}) {
  let latest!: AppState;
  function Watch() { const { state } = useStore(); useEffect(() => { latest = state; }); return null; }
  render(<StoreProvider initial={{ ...initialState, layer: "map", entered: true, ...patch }}><MapScreen /><Watch /></StoreProvider>);
  return { state: () => latest };
}
const markers = () => screen.getAllByRole("button").filter((b) => b.hasAttribute("data-state"));
const states = () => markers().map((m) => m.getAttribute("data-state"));

describe("MapScreen", () => {
  it("shows every location, the eight canon and the four bonus", () => {
    show();
    expect(markers()).toHaveLength(12);
    expect(markers()).toHaveLength(LOCATIONS.length);
  });

  it("at the start only LeBlanc is open (and it is where we are): one current, eleven locked", () => {
    show();
    const s = states();
    expect(s.filter((x) => x === "current")).toHaveLength(1);
    expect(s.filter((x) => x === "locked")).toHaveLength(11);
    expect(s.filter((x) => x === "unlocked")).toHaveLength(0);
    expect(screen.getByRole("button", { name: /Café Leblanc/ })).toHaveAttribute("aria-current", "location");
  });

  it("the states follow progress: with Ryuji unlocked, he is open and the rest are locked", () => {
    show({ events: [{ kind: "dev_grant", knowledge: 40 }] });
    const byState = (state: string) => markers().filter((m) => m.getAttribute("data-state") === state).length;
    expect(byState("current")).toBe(1);
    expect(byState("unlocked")).toBe(1); // Ryuji
    expect(byState("locked")).toBe(10);
    expect(screen.getByRole("button", { name: /School rooftop/ })).toHaveAttribute("data-state", "unlocked");
  });

  it("with everything unlocked there is one current marker and eleven open ones", () => {
    show({ devUnlockAll: true });
    expect(markers().filter((m) => m.getAttribute("data-state") === "locked")).toHaveLength(0);
    expect(markers().filter((m) => m.getAttribute("data-state") === "unlocked")).toHaveLength(11);
  });

  it("a locked place does not give its name, and says nothing about when it opens (nothing telegraphs what unlocks)", () => {
    show();
    const locked = markers().filter((m) => m.getAttribute("data-state") === "locked");
    for (const m of locked) {
      expect(m).toBeDisabled();
      expect(m.textContent).toMatch(/^Place \d+Locked$/); // its order and that it is locked, nothing more
      expect(m.textContent).not.toMatch(/level|reach|\bLv\b/i);
    }
    const everything = locked.map((m) => m.textContent).join(" ");
    for (const l of LOCATIONS.filter((x) => x.id !== "leblanc")) expect(everything).not.toContain(l.name); // names stay hidden
  });

  it("choosing an open place starts travel to it; the current place and locked ones do nothing", () => {
    const s = show({ events: [{ kind: "dev_grant", knowledge: 40 }] });
    fireEvent.click(screen.getByRole("button", { name: /Café Leblanc/ })); // where we are
    expect(s.state().layer).toBe("map");
    act(() => { markers().find((m) => m.getAttribute("data-state") === "locked")!.click(); });
    expect(s.state().layer).toBe("map");
    fireEvent.click(screen.getByRole("button", { name: /School rooftop/ }));
    expect(s.state()).toMatchObject({ layer: "travel", travelTo: "ryuji" });
  });
});
