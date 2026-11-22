import { describe, expect, it } from "vitest";
import { initialState, type AppState } from "@/state/store";
import { shortcutAction } from "./shortcuts";

const room: AppState = { ...initialState, entered: true, layer: "main" };
const open = { mapOpen: true };
const shut = { mapOpen: false };
const press = (key: string, state: AppState = room, derived = open, mods = {}) =>
  shortcutAction(key, state, derived, 1000, { typing: false, ...mods });

describe("shortcutAction", () => {
  it("M opens the menu from the room and closes it from the menu", () => {
    expect(press("m")).toEqual({ type: "SET_LAYER", layer: "menu" });
    expect(press("M")).toEqual({ type: "SET_LAYER", layer: "menu" });
    expect(press("m", { ...room, layer: "menu" })).toEqual({ type: "CLOSE_LAYER" });
  });

  it("N opens the map only once the map is earned", () => {
    expect(press("n")).toEqual({ type: "SET_LAYER", layer: "map" });
    expect(press("n", room, shut)).toBeNull();
  });

  it("H toggles Hide UI in the room only", () => {
    expect(press("h")).toEqual({ type: "TOGGLE_HUD" });
    expect(press("h", { ...room, layer: "menu" })).toBeNull();
  });

  it("Space starts, pauses and resumes the timer, and starts again after a finished one", () => {
    expect(press(" ")).toMatchObject({ type: "TIMER", event: { type: "START" } });
    const running = { ...room, timer: { status: "running", durationMs: 1, endsAt: 5 } } as AppState;
    expect(press(" ", running)).toMatchObject({ event: { type: "PAUSE" } });
    const paused = { ...room, timer: { status: "paused", durationMs: 1, remainingMs: 1 } } as AppState;
    expect(press(" ", paused)).toMatchObject({ event: { type: "RESUME" } });
    const done = { ...room, timer: { status: "complete", durationMs: 1 } } as AppState;
    expect(press(" ", done)).toMatchObject({ type: "START_SESSION" });
  });

  it("leaves Space to a focused button", () => {
    expect(press(" ", room, open, { onButton: true })).toBeNull();
  });

  it("Escape closes dismissable layers, then the phone, and never the session-end choice", () => {
    expect(press("Escape", { ...room, layer: "settings" })).toEqual({ type: "CLOSE_LAYER" });
    expect(press("Escape", { ...room, phoneOpen: true })).toEqual({ type: "SET_PHONE", open: false });
    expect(press("Escape", { ...room, layer: "choice" })).toBeNull();
  });

  it("does nothing while typing, except Escape, and ignores modifier combos", () => {
    expect(press("m", room, open, { typing: true })).toBeNull();
    expect(press("Escape", { ...room, layer: "menu" }, open, { typing: true })).toEqual({ type: "CLOSE_LAYER" });
    expect(press("m", room, open, { meta: true })).toBeNull();
  });
});
