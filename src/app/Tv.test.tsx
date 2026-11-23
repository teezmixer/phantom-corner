import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLOCKED_AFTER_MS } from "@/audio/music/useMusic";
import type { BackendFactory, Handlers, MusicBackend } from "@/audio/music/youtube";
import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import { EVENT_NAMES, setSender, type EventName, type EventProps } from "./analytics";
import { setAnalyticsAllowed } from "./telemetry";
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
    // The player's INNER area must be 200×200: the 2 px border (border-box sizing) is added on each side.
    expect(box.style.height).toBe("204px");
    expect(box.style.width).toBe("204px");
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

  it("follows the player's own state: a user click on the video itself updates the caption", async () => {
    const { latest } = await setup();
    emit(() => latest().handlers.onState("playing")); // the user clicked the YouTube player directly
    expect(caption()).toBe(PLACEHOLDER_PLAYLIST[0]!.title);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("a track that ends does not start another while paused", async () => {
    const { latest } = await setup();
    click("Play");
    emit(() => latest().handlers.onState("playing"));
    click("Pause");
    const load = latest().backend.load as unknown as ReturnType<typeof vi.fn>;
    load.mockClear();
    emit(() => latest().handlers.onState("ended"));
    expect(load).not.toHaveBeenCalled();
    expect(caption()).toContain("Paused");
  });

  it("stays 'tuning in' while the player is still being created — a slow script is not a browser block", async () => {
    const never: BackendFactory = vi.fn(() => new Promise<MusicBackend>(() => undefined));
    await setup({ factory: never });
    click("Play");
    act(() => { vi.advanceTimersByTime(BLOCKED_AFTER_MS * 3); });
    expect(caption()).toBe("Tuning in.");
  });

  it("pressing play after the script failed tries to create the player again", async () => {
    const real = fakeFactory();
    let calls = 0;
    const flaky: BackendFactory = vi.fn(async (c, h, s) => {
      calls += 1;
      if (calls === 1) throw new Error("offline");
      return real.factory(c, h, s);
    });
    await setup({ factory: flaky });
    expect(caption()).toBe("That tape's gone. Skipping it.");
    expect(screen.getByRole("button", { name: "Play" })).toBeEnabled(); // a retry is possible
    click("Play");
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(flaky).toHaveBeenCalledTimes(2);
    expect(real.created).toHaveLength(1);
    // a brand-new player has nothing loaded, so the requested play is a load-and-play of the current track
    expect(real.latest().backend.load).toHaveBeenCalledWith(PLACEHOLDER_PLAYLIST[0]!.videoId, true);
  });

  it("gives the factory an abort signal that fires on unmount, so a cancelled creation builds nothing", async () => {
    let signal: AbortSignal | undefined;
    const factory: BackendFactory = vi.fn(async (_c, _h, s) => { signal = s; return fakeFactory().factory(_c, _h, s); });
    const { unmount } = await setup({ factory });
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it("travelling to another location stops the music even when both share the same playlist (D-26)", async () => {
    const { latest, dispatch } = await setup();
    click("Play");
    emit(() => latest().handlers.onState("playing"));
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    dispatch({ type: "DEV_JUMP_LOCATION", id: "ryuji" });
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(caption()).toBe("TV's off.");
  });

  it("while a screen is open the caption goes screen-reader-only and the mixer closes, so neither covers a dialog", async () => {
    const fake = fakeFactory();
    const { rerender } = render(<StoreProvider initial={{ ...initialState, entered: true, layer: "main" }}><Tv scale={1} factory={fake.factory} /></StoreProvider>);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    click("Mixer");
    expect(screen.getByRole("group", { name: "Mixer" })).toBeInTheDocument();
    rerender(<StoreProvider initial={{ ...initialState, entered: true, layer: "main" }}><Tv scale={1} locked factory={fake.factory} /></StoreProvider>);
    expect(screen.queryByRole("group", { name: "Mixer" })).not.toBeInTheDocument();
    expect(screen.getByRole("status").className).toContain("sr-only");
  });

  it("honours a pause pressed while a track is still loading, even if the video then starts anyway", async () => {
    const { latest } = await setup();
    click("Play");
    expect(caption()).toBe("Tuning in.");
    click("Pause"); // paused before the video ever started
    expect(caption()).toContain("Paused");
    const pause = latest().backend.pause as unknown as ReturnType<typeof vi.fn>;
    pause.mockClear();
    emit(() => latest().handlers.onState("playing")); // …but it starts a moment later
    expect(pause).toHaveBeenCalledTimes(1); // told to pause again
    expect(caption()).toContain("Paused"); // the user's pause stands
    // a click on the video itself later is a fresh user action and is followed
    act(() => { vi.advanceTimersByTime(5000); });
    emit(() => latest().handlers.onState("playing"));
    expect(caption()).toBe(PLACEHOLDER_PLAYLIST[0]!.title);
  });

  it("destroys its player when it unmounts", async () => {
    const { created, unmount } = await setup();
    expect(created.every((c) => c.destroyed)).toBe(false);
    unmount();
    expect(created.every((c) => c.destroyed)).toBe(true);
  });
});

describe("TV analytics (spec §4.16)", () => {
  const sent: { name: EventName; props: EventProps }[] = [];
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); sent.length = 0; setAnalyticsAllowed(true); setSender((name, props) => { sent.push({ name, props }); }); });
  afterEach(() => { vi.useRealTimers(); setAnalyticsAllowed(true); });
  const music = () => sent.filter((e) => e.name === "music_played" || e.name === "track_unavailable");

  it("music_played when the music starts playing, once, with the place", async () => {
    const { latest } = await setup();
    emit(() => latest().handlers.onState("playing"));
    expect(music()).toEqual([{ name: "music_played", props: { location: "leblanc" } }]);
    emit(() => latest().handlers.onState("playing")); // still playing: not again
    expect(music()).toHaveLength(1);
    emit(() => latest().handlers.onState("paused"));
    emit(() => latest().handlers.onState("playing")); // pressed play again: a new play
    expect(music()).toHaveLength(2);
  });

  it("track_unavailable each time a track fails, with the place", async () => {
    const { latest } = await setup();
    emit(() => latest().handlers.onError(150));
    expect(music()).toEqual([{ name: "track_unavailable", props: { location: "leblanc" } }]);
    emit(() => latest().handlers.onError(101));
    expect(music().map((e) => e.name)).toEqual(["track_unavailable", "track_unavailable"]);
  });

  it("nothing while the switch is off", async () => {
    setAnalyticsAllowed(false);
    const { latest } = await setup();
    emit(() => latest().handlers.onState("playing"));
    emit(() => latest().handlers.onError(150));
    expect(music()).toEqual([]);
  });

  it("only events from the list, and never anything but where", async () => {
    const { latest } = await setup();
    emit(() => latest().handlers.onState("playing"));
    emit(() => latest().handlers.onError(150));
    for (const e of sent) { expect(EVENT_NAMES).toContain(e.name); expect(Object.keys(e.props)).toEqual(["location"]); }
  });
});

describe("the player's own links", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());
  const VIDEO = "dQw4w9WgXcQ";
  const openPanel = () => click("Add your own link");
  const paste = (text: string) => { fireEvent.change(screen.getByLabelText("Paste a YouTube link"), { target: { value: text } }); };
  const submit = () => act(() => { fireEvent.submit(screen.getByLabelText("Paste a YouTube link").closest("form")!); });

  it("a pasted link plays in the window at once (the Play press is the user's action), under a name of its own", async () => {
    const { latest } = await setup();
    await openPanel();
    paste(`https://youtu.be/${VIDEO}?si=abc`);
    submit();
    await act(async () => { await Promise.resolve(); });
    expect(latest().backend.load).toHaveBeenCalledWith(VIDEO, true);
    expect(caption()).toBe("Tuning in.");
    emit(() => latest().handlers.onState("playing"));
    expect(caption()).toBe("Your link 1");
    expect(screen.queryByLabelText("Paste a YouTube link")).not.toBeInTheDocument(); // the panel closes
  });

  it("adding a link does not stop what is playing until Play is pressed", async () => {
    const { latest, dispatch } = await setup();
    await click("Play");
    emit(() => latest().handlers.onState("playing"));
    expect(caption()).toBe("Beneath the Mask");
    await dispatch({ type: "ADD_USER_TRACK", id: VIDEO }); // added without pressing its Play
    expect(caption()).toBe("Beneath the Mask");
    expect(latest().backend.pause).not.toHaveBeenCalled();
  });

  it("something that is not a single YouTube video is refused in words, and nothing is added or played", async () => {
    const { latest } = await setup();
    await openPanel();
    for (const bad of ["hello", "https://example.com/watch?v=" + VIDEO, "https://www.youtube.com/playlist?list=PLabc"]) {
      paste(bad);
      submit();
      expect(screen.getByRole("alert")).toHaveTextContent("isn't a link to a single YouTube video");
    }
    expect(latest().backend.load).not.toHaveBeenCalledWith(expect.anything(), true);
    expect(screen.queryByRole("list", { name: "Your links" })).not.toBeInTheDocument();
  });

  it("lists the links, plays one on request, and removes one without stopping the others", async () => {
    const { latest, dispatch } = await setup();
    await dispatch({ type: "ADD_USER_TRACK", id: VIDEO });
    await dispatch({ type: "ADD_USER_TRACK", id: "9bZkp7q19f0" });
    await openPanel();
    expect(screen.getByRole("list", { name: "Your links" }).querySelectorAll("li")).toHaveLength(2);
    await click("Play your link 2");
    expect(latest().backend.load).toHaveBeenCalledWith("9bZkp7q19f0", true);
    await openPanel();
    await click("Remove your link 1");
    expect(screen.getByRole("list", { name: "Your links" }).querySelectorAll("li")).toHaveLength(1);
  });

  it("a link that cannot play says so, and does not slide on to another track in silence", async () => {
    const { latest } = await setup();
    await openPanel();
    paste(`https://youtu.be/${VIDEO}`);
    submit();
    await act(async () => { await Promise.resolve(); });
    emit(() => latest().handlers.onError(150));
    expect(caption()).toBe("That video can't play here.");
    expect(latest().backend.load).not.toHaveBeenCalledWith(PLACEHOLDER_PLAYLIST[0]!.videoId, true);
  });

  it("the caption box is only as wide as its words", async () => {
    await setup();
    expect(screen.getByRole("status").className).toContain("w-fit");
  });
});
