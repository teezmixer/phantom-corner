import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialState } from "@/state/store";
import { StoreProvider } from "@/state/StoreProvider";
import { Tv } from "@/app/Tv";
import { createYouTubeBackend, type Handlers } from "./youtube";

interface Opts { events: { onReady(): void; onStateChange(e: { data: number }): void; onError(e: { data: number }): void } }
/** A fake of the real IFrame API that records every player and whether it was destroyed. */
function installFakeYT() {
  const players: { opts: Opts; destroyed: boolean; el: HTMLElement; ready(): void }[] = [];
  class FakePlayer {
    entry: (typeof players)[number];
    constructor(el: HTMLElement, opts: Opts) {
      this.entry = { opts, destroyed: false, el, ready: () => opts.events.onReady() };
      players.push(this.entry);
    }
    destroy() { this.entry.destroyed = true; }
    loadVideoById = vi.fn(); cueVideoById = vi.fn(); playVideo = vi.fn(); pauseVideo = vi.fn();
    setVolume = vi.fn(); mute = vi.fn(); unMute = vi.fn();
  }
  (window as unknown as { YT: unknown }).YT = { Player: FakePlayer };
  return players;
}
const handlers = (): Handlers => ({ onState: vi.fn(), onError: vi.fn() });

describe("createYouTubeBackend", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); delete (window as unknown as { YT?: unknown }).YT; });

  it("resolves a usable backend once the player is ready", async () => {
    const players = installFakeYT();
    const container = document.createElement("div");
    const h = handlers();
    const promise = createYouTubeBackend(container, h);
    await vi.advanceTimersByTimeAsync(0);
    players[0]!.ready();
    const backend = await promise;
    backend.load("abc", true);
    backend.setVolume(40);
    players[0]!.opts.events.onStateChange({ data: 1 });
    expect(h.onState).toHaveBeenCalledWith("playing");
    backend.destroy();
    expect(players[0]!.destroyed).toBe(true);
  });

  it("a player that never becomes ready is destroyed, its iframe removed and its late events ignored", async () => {
    const players = installFakeYT();
    const container = document.createElement("div");
    const h = handlers();
    const promise = createYouTubeBackend(container, h);
    const rejected = expect(promise).rejects.toThrow(/did not become ready/);
    await vi.advanceTimersByTimeAsync(10_001);
    await rejected;
    expect(players).toHaveLength(1);
    expect(players[0]!.destroyed).toBe(true);
    expect(container.children).toHaveLength(0); // the mount div is gone
    players[0]!.opts.events.onReady(); // a late event from the dead player…
    players[0]!.opts.events.onStateChange({ data: 1 });
    players[0]!.opts.events.onError({ data: 150 });
    expect(h.onState).not.toHaveBeenCalled(); // …reaches nobody
    expect(h.onError).not.toHaveBeenCalled();
  });

  it("an abort before ready also destroys the player; an abort before the script loads builds none", async () => {
    const players = installFakeYT();
    const container = document.createElement("div");
    const controller = new AbortController();
    const promise = createYouTubeBackend(container, handlers(), controller.signal);
    const rejected = expect(promise).rejects.toThrow(/cancelled/);
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await rejected;
    expect(players[0]!.destroyed).toBe(true);
    expect(container.children).toHaveLength(0);

    const already = new AbortController();
    already.abort();
    await expect(createYouTubeBackend(container, handlers(), already.signal)).rejects.toThrow(/cancelled/);
    expect(players).toHaveLength(1); // nothing was built for the already-cancelled request
  });
});

describe("TV with the real backend: retry after a player that never became ready", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => { vi.useRealTimers(); delete (window as unknown as { YT?: unknown }).YT; });

  it("leaves exactly one live player after pressing play to retry", async () => {
    const players = installFakeYT();
    render(<StoreProvider initial={{ ...initialState, entered: true, layer: "main" }}><Tv scale={1} /></StoreProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(10_100); }); // the first player never says ready → API_FAILED
    expect(screen.getByRole("status").textContent).toBe("That tape's gone. Skipping it.");
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Play" })); }); // retry
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    players.at(-1)!.ready();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(players).toHaveLength(2);
    expect(players.filter((p) => !p.destroyed)).toHaveLength(1); // the abandoned one is gone
    expect(document.querySelectorAll('[data-testid="tv-player"] > *').length).toBeLessThanOrEqual(1);
  });
});
