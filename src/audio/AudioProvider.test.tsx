import { act, fireEvent, render } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { getLocation } from "@/content/registry";
import { initialState, type Action, type AppState } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { AudioProvider, useAudio } from "./AudioProvider";
import type { AudioEngine } from "./engine";

function fakeEngine() {
  let isUnlocked = false;
  const engine = {
    get unlocked() { return isUnlocked; },
    unlock: vi.fn(() => { isUnlocked = true; }),
    configure: vi.fn(),
    setAmbience: vi.fn(),
    setLayerLevels: vi.fn(),
    stopAmbience: vi.fn(),
    playSfx: vi.fn(),
  };
  return engine;
}

function setup(start: Partial<AppState> = {}) {
  const engine = fakeEngine();
  let dispatch!: (a: Action) => void;
  function Grab() {
    const s = useStore();
    useEffect(() => { dispatch = s.dispatch; });
    return null;
  }
  const view = render(
    <StoreProvider initial={{ ...initialState, ...start }}>
      <AudioProvider engine={engine as unknown as AudioEngine}>
        <Grab />
        <div role="dialog" aria-label="d"><button type="button">press</button></div>
      </AudioProvider>
    </StoreProvider>,
  );
  return { engine, dispatch: (a: Action) => act(() => dispatch(a)), view };
}

const lastConfig = (e: ReturnType<typeof fakeEngine>) => e.configure.mock.calls.at(-1)![0];

describe("AudioProvider", () => {
  it("does not unlock audio until the user's first gesture, and keeps trying on later ones (a suspended context can resume)", () => {
    const { engine } = setup();
    expect(engine.unlock).not.toHaveBeenCalled();
    act(() => { fireEvent.pointerDown(window); });
    expect(engine.unlock).toHaveBeenCalledTimes(1);
    act(() => { fireEvent.keyDown(window, { key: "a" }); });
    act(() => { fireEvent.touchEnd(window); });
    act(() => { fireEvent.click(window); });
    expect(engine.unlock).toHaveBeenCalledTimes(4); // every gesture re-tries; unlock() itself is idempotent
  });

  it("reports whether the user has made a gesture yet, so the YouTube player can wait for it", () => {
    let seen: boolean[] = [];
    function Probe() { const { gestured } = useAudio(); seen = [...seen, gestured]; return null; }
    const engine = fakeEngine();
    render(<StoreProvider initial={{ ...initialState }}><AudioProvider engine={engine as unknown as AudioEngine}><Probe /></AudioProvider></StoreProvider>);
    expect(seen.at(-1)).toBe(false);
    act(() => { fireEvent.pointerDown(window); });
    expect(seen.at(-1)).toBe(true);
  });

  it("passes mute and volumes to the engine, and halves interface sounds while a session runs", () => {
    const { engine, dispatch } = setup({ entered: true, layer: "main" });
    expect(lastConfig(engine)).toEqual({ muted: false, volumes: { ambience: 0.35, ui: 0.7 }, uiDucked: false });
    dispatch({ type: "TOGGLE_MUTE" });
    expect(lastConfig(engine).muted).toBe(true);
    dispatch({ type: "SET_VOLUME", bus: "ui", value: 0.2 });
    expect(lastConfig(engine).volumes.ui).toBe(0.2);
    dispatch({ type: "TIMER", event: { type: "START", now: 1000 }, now: 1000 });
    expect(lastConfig(engine).uiDucked).toBe(true);
  });

  it("starts the current location's ambience only after audio is unlocked and the user has entered, and follows travel", () => {
    const { engine, dispatch } = setup({ entered: true, layer: "main" });
    expect(engine.setAmbience).not.toHaveBeenCalled(); // not unlocked yet
    act(() => { fireEvent.pointerDown(window); });
    expect(engine.setAmbience).toHaveBeenLastCalledWith(getLocation("leblanc").ambience);
    dispatch({ type: "DEV_JUMP_LOCATION", id: "ryuji" });
    expect(engine.setAmbience).toHaveBeenLastCalledWith(getLocation("ryuji").ambience);
  });

  it("stays silent on the splash even after unlocking", () => {
    const { engine } = setup({ entered: false, layer: "splash" });
    act(() => { fireEvent.pointerDown(window); });
    expect(engine.setAmbience).not.toHaveBeenCalled();
    expect(engine.stopAmbience).toHaveBeenCalled();
  });

  it("applies the per-layer ambience mix", () => {
    const { engine, dispatch } = setup({ entered: true, layer: "main" });
    dispatch({ type: "SET_LAYER_VOLUME", id: "leblanc-rain", value: 0.25 });
    expect(engine.setLayerLevels).toHaveBeenLastCalledWith({ "leblanc-rain": 0.25 });
  });

  it("plays interface sounds from state changes", () => {
    const { engine, dispatch } = setup({ entered: true, layer: "main" });
    dispatch({ type: "SET_LAYER", layer: "menu" });
    expect(engine.playSfx).toHaveBeenCalledWith("menuOpen");
  });

  it("ticks for a button press inside a screen, but not when the press brings its own sound (no double sound on Close)", () => {
    vi.useFakeTimers();
    try {
      const { engine, dispatch, view } = setup({ entered: true, layer: "menu" });
      engine.playSfx.mockClear();
      // a plain press: the tick plays shortly after
      fireEvent.click(view.getByRole("button", { name: "press" }));
      act(() => { vi.advanceTimersByTime(80); });
      expect(engine.playSfx).toHaveBeenCalledWith("select");
      // a press that closes the menu: the screen's own sound plays and the tick is cancelled
      engine.playSfx.mockClear();
      fireEvent.click(view.getByRole("button", { name: "press" }));
      dispatch({ type: "SET_LAYER", layer: "main" });
      act(() => { vi.advanceTimersByTime(80); });
      expect(engine.playSfx).toHaveBeenCalledTimes(1);
      expect(engine.playSfx).toHaveBeenCalledWith("menuClose");
    } finally {
      vi.useRealTimers();
    }
  });

  it("makes no sound on first render", () => {
    const { engine } = setup({ entered: true, layer: "main" });
    expect(engine.playSfx).not.toHaveBeenCalled();
  });
});
