import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLOCKED_AFTER_MS } from "@/audio/music/useMusic";
import type { BackendFactory, Handlers, MusicBackend } from "@/audio/music/youtube";
import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import { initialState, type Action } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { Tv } from "./Tv";

function fakeFactory() {
  const created: { backend: MusicBackend & Record<string, ReturnType<typeof vi.fn>>; handlers: Handlers; destroyed: boolean }[] = [];
  const factory: BackendFactory = vi.fn(async (_container, handlers) => {
    const backend = { load: vi.fn(), play: vi.fn(), pause: vi.fn(), setVolume: vi.fn(), setMuted: vi.fn(), destroy: vi.fn() };
    const entry = { backend, handlers, destroyed: false };
    backend.destroy.mockImplementation(() => { entry.destroyed = true; });
    created.push(entry);
    return backend;
  });
  return { factory, created, latest: () => created.at(-1)! };
}

async function setup(opts: { strict?: boolean; factory?: BackendFactory } = {}) {
  const fake = fakeFactory();
  let dispatch!: (a: Action) => void;
  function Grab() {
    const s = useStore();
    useEffect(() => { dispatch = s.dispatch; });
    return null;
  }
  const tree = (
    <StoreProvider initial={{ ...initialState, entered: true, layer: "main" }}>
      <Grab />
      <Tv scale={1} factory={opts.factory ?? fake.factory} />
    </StoreProvider>
  );
  const view = render(opts.strict ? <StrictMode>{tree}</StrictMode> : tree);
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  return { ...fake, unmount: view.unmount, dispatch: (a: Action) => act(() => dispatch(a)) };
}

const caption = () => screen.getByRole("status").textContent;
const click = (name: string) => act(() => { fireEvent.click(screen.getByRole("button", { name })); });
const emit = (fn: () => void) => act(() => fn());

describe("TV", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("has exactly one player, in a 200×200 box that is never scaled down", async () => {
    const { created } = await setup();
    expect(created).toHaveLength(1);
    const box = screen.getByTestId("tv-player");
    expect(box.style.height).toBe("200px");
    expect(parseInt(box.style.width)).toBeGreaterThanOrEqual(200);
  });

  it("is one player even under React StrictMode's double effects", async () => {
    const { created } = await setup({ strict: true });
    expect(created.filter((c) => !c.destroyed)).toHaveLength(1);
  });

  it("plays nothing until the user presses play: the track is only cued", async () => {
    const { latest } = await setup();
    expect(latest().backend.load).toHaveBeenCalledWith(PLACEHOLDER_PLAYLIST[0]!.videoId, false);
    expect(latest().backend.play).not.toHaveBeenCalled();
    expect(latest().backend.load).not.toHaveBeenCalledWith(expect.anything(), true);
    expect(caption()).toBe("TV's off.");
  });

  it("starts the cued track when the user presses play, then pauses on request", async () => {
    const { latest } = await setup();
    click("Play");
    expect(latest().backend.play).toHaveBeenCalledTimes(1);
    expect(caption()).toBe("Tuning in.");
    emit(() => latest().handlers.onState("playing"));
    expect(caption()).toBe(PLACEHOLDER_PLAYLIST[0]!.title);
    click("Pause");
    expect(latest().backend.pause).toHaveBeenCalledTimes(1);
    expect(caption()).toContain("Paused");
  });

  it("next and previous load another track and start it (the user asked)", async () => {
    const { latest } = await setup();
    click("Next track");
    expect(latest().backend.load).toHaveBeenLastCalledWith(PLACEHOLDER_PLAYLIST[1]!.videoId, true);
    click("Previous track");
    expect(latest().backend.load).toHaveBeenLastCalledWith(PLACEHOLDER_PLAYLIST[0]!.videoId, true);
  });

  it("skips a track that cannot play, silently, and carries on with the next", async () => {
    const { latest } = await setup();
    click("Play");
    emit(() => latest().handlers.onError(150));
    expect(latest().backend.load).toHaveBeenLastCalledWith(PLACEHOLDER_PLAYLIST[1]!.videoId, true);
    expect(caption()).toBe("Tuning in."); // no error message: it just moves on
  });

  it("says the TV cannot play when every track has failed, and disables the controls", async () => {
    const { latest } = await setup();
    click("Play");
    emit(() => latest().handlers.onError(150));
    emit(() => latest().handlers.onError(101));
    emit(() => latest().handlers.onError(100));
    expect(caption()).toBe("That tape's gone. Skipping it.");
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
  });

  it("reports blocked when a requested play never starts, and recovers when it does", async () => {
    const { latest } = await setup();
    click("Play");
    act(() => { vi.advanceTimersByTime(BLOCKED_AFTER_MS + 50); });
    expect(caption()).toBe("It won't start on its own. Press play on the screen.");
    emit(() => latest().handlers.onState("playing"));
    expect(caption()).toBe(PLACEHOLDER_PLAYLIST[0]!.title);
  });

  it("says unavailable when the YouTube script cannot load (offline)", async () => {
    await setup({ factory: vi.fn(async () => { throw new Error("offline"); }) });
    expect(caption()).toBe("That tape's gone. Skipping it.");
  });

  it("applies the music volume and mute to the player", async () => {
    const { latest, dispatch } = await setup();
    expect(latest().backend.setVolume).toHaveBeenLastCalledWith(50);
    expect(latest().backend.setMuted).toHaveBeenLastCalledWith(false);
    dispatch({ type: "SET_VOLUME", bus: "music", value: 0.2 });
    expect(latest().backend.setVolume).toHaveBeenLastCalledWith(20);
    dispatch({ type: "TOGGLE_MUTE" });
    expect(latest().backend.setMuted).toHaveBeenLastCalledWith(true);
  });

  it("destroys its player when it unmounts", async () => {
    const { created, unmount } = await setup();
    expect(created.every((c) => c.destroyed)).toBe(false);
    unmount();
    expect(created.every((c) => c.destroyed)).toBe(true);
  });
});

