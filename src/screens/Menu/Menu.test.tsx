import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { AudioProvider } from "@/audio/AudioProvider";
import type { AudioEngine } from "@/audio/engine";
import { initialState, type AppState } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { Menu } from "./Menu";

function setup(start: Partial<AppState> = {}) {
  const engine = { unlocked: true, unlock: vi.fn(), configure: vi.fn(), setAmbience: vi.fn(), setLayerLevels: vi.fn(), stopAmbience: vi.fn(), playSfx: vi.fn() };
  let latest!: AppState;
  function Watch() { const { state } = useStore(); useEffect(() => { latest = state; }); return null; }
  render(
    <StoreProvider initial={{ ...initialState, entered: true, layer: "menu", ...start }}>
      <AudioProvider engine={engine as unknown as AudioEngine}>
        <Watch />
        <Menu />
      </AudioProvider>
    </StoreProvider>,
  );
  const names = () => screen.getAllByRole("button").map((b) => b.textContent ?? "");
  const focused = () => document.activeElement?.textContent ?? "";
  const key = (k: string) => fireEvent.keyDown(document.activeElement ?? document.body, { key: k });
  return { engine, names, focused, key, state: () => latest };
}

const selects = (engine: ReturnType<typeof setup>["engine"]) => engine.playSfx.mock.calls.filter(([id]) => id === "select").length;

describe("Menu", () => {
  it("lists the spec's labels, with MAP and MESSAGES present even before they exist", () => {
    const { names } = setup();
    expect(names().map((n) => n.replace(/\s*Not yet\.$/, ""))).toEqual(["STUDY", "MAP", "MESSAGES", "PROFILE", "SETTINGS", "CLOSE"]);
  });

  it("puts the highlight on the first label when it opens", () => {
    expect(setup().focused()).toBe("STUDY");
  });

  it("ArrowDown and ArrowUp move the highlight and wrap around, each move with a sound", () => {
    const { focused, key, engine } = setup({ devUnlockAll: true });
    key("ArrowDown");
    expect(focused()).toBe("MAP");
    key("ArrowUp"); key("ArrowUp");
    expect(focused()).toBe("CLOSE"); // wrapped from the first to the last
    key("ArrowDown");
    expect(focused()).toBe("STUDY"); // and back
    expect(selects(engine)).toBe(4);
  });

  it("Home and End jump to the ends", () => {
    const { focused, key } = setup();
    key("End");
    expect(focused()).toBe("CLOSE");
    key("Home");
    expect(focused()).toBe("STUDY");
  });

  it("does not play a sound when the highlight has nowhere new to go", () => {
    const { key, engine } = setup();
    key("Home"); // already on the first label
    expect(selects(engine)).toBe(0);
  });

  it("Enter on a focused label selects it", () => {
    const { key, state } = setup();
    key("End"); key("ArrowUp"); // SETTINGS
    expect(document.activeElement?.textContent).toBe("SETTINGS");
    act(() => (document.activeElement as HTMLElement).click()); // Enter on a button is a click
    expect(state().layer).toBe("settings");
  });

  it("a label that is not built yet is struck through, says so, can be reached with the keyboard and does nothing", () => {
    const { focused, key, state } = setup(); // map is locked at the start
    key("ArrowDown");
    const map = screen.getByRole("button", { name: /MAP/ });
    expect(focused()).toContain("MAP");
    expect(map).toHaveAttribute("aria-disabled", "true");
    expect(map).toHaveTextContent("Not yet.");
    expect(map.querySelector(".line-through")).not.toBeNull();
    act(() => map.click());
    expect(state().layer).toBe("menu"); // still here
  });

  it("MAP is selectable once the map is open", () => {
    const { key, state } = setup({ devUnlockAll: true });
    key("ArrowDown");
    const map = screen.getByRole("button", { name: /MAP/ });
    expect(map).not.toHaveAttribute("aria-disabled");
    act(() => map.click());
    expect(state().layer).toBe("map");
  });

  it("labels fly in one after another, in order", () => {
    setup();
    const delays = screen.getAllByRole("listitem").map((li) => (li as HTMLElement).style.getPropertyValue("--i"));
    expect(delays).toEqual(["0", "1", "2", "3", "4", "5"]);
  });

  it("STUDY from an idle timer starts a session and returns to the room", () => {
    const { state } = setup();
    expect(state().timer.status).toBe("idle");
    act(() => screen.getByRole("button", { name: "STUDY" }).click());
    expect(state().timer.status).toBe("running");
    expect(state().layer).toBe("main");
  });

  it("STUDY while a session is already running just returns to the room, without restarting it", () => {
    const first = setup();
    act(() => screen.getByRole("button", { name: "STUDY" }).click());
    const running = first.state().timer;
    expect(running.status).toBe("running");
    cleanup();
    const { state } = setup({ timer: running, layer: "menu" });
    act(() => screen.getByRole("button", { name: "STUDY" }).click());
    expect(state().timer).toEqual(running); // the same session, untouched
    expect(state().layer).toBe("main");
  });

  it("a not-yet label is announced with a space between the name and the note", () => {
    setup();
    expect(screen.getByRole("button", { name: /^MAP\s+Not yet\.$/ })).toBeInTheDocument();
  });

  it("the arrow keys still work after a click on the panel left nothing focused", () => {
    const { focused } = setup();
    (document.activeElement as HTMLElement).blur(); // focus is on the page body, as after clicking the heading
    expect(document.activeElement).toBe(document.body);
    fireEvent.keyDown(document.body, { key: "ArrowDown" });
    expect(focused()).toBe("STUDY"); // nothing highlighted: down goes to the first label
    (document.activeElement as HTMLElement).blur();
    fireEvent.keyDown(document.body, { key: "ArrowUp" });
    expect(focused()).toBe("CLOSE"); // up goes to the last
  });

  it("arrow keys pressed in a control outside the menu are left to that control", () => {
    const { focused } = setup();
    const outside = document.createElement("select");
    document.body.appendChild(outside);
    outside.focus();
    fireEvent.keyDown(outside, { key: "ArrowDown" });
    expect(document.activeElement).toBe(outside); // the menu did not take the key
    expect(focused()).toBe("");
    outside.remove();
  });
});
