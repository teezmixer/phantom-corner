import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import type { BackendFactory } from "@/audio/music/youtube";
import type { TrackRef } from "@/content/types";
import { initialState, type Action } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { Tv } from "./Tv";

const track = (id: string, title: string): TrackRef => ({ videoId: id.padEnd(11, "x"), title, source: "rights-holder", checkedOn: "2026-11-22" });
const PLAYLISTS: Record<string, TrackRef[]> = {
  leblanc: [track("cafe1", "Café theme")],
  ryuji: [track("roof1", "Rooftop theme"), track("roof2", "Rooftop two")],
};
// Two locations with different playlists, standing in for the real per-location music Ares will choose.
vi.mock("@/content/registry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/content/registry")>()),
  getLocation: (id: string) => ({ playlist: PLAYLISTS[id] ?? [], ambience: [] }),
}));

describe("TV: a playlist per location", () => {
  it("travelling swaps the playlist and stops playback; the new first track is cued, not played", async () => {
    const loads: [string, boolean][] = [];
    const factory: BackendFactory = async () => ({ load: (id, play) => { loads.push([id, play]); }, play: vi.fn(), pause: vi.fn(), setVolume: vi.fn(), setMuted: vi.fn(), destroy: vi.fn() });
    let dispatch!: (a: Action) => void;
    function Grab() { const s = useStore(); useEffect(() => { dispatch = s.dispatch; }); return null; }
    render(
      <StoreProvider initial={{ ...initialState, entered: true, layer: "main", locationId: "leblanc" }}>
        <Grab />
        <Tv scale={1} factory={factory} />
      </StoreProvider>,
    );
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(loads.at(-1)).toEqual(["cafe1xxxxxx", false]); // LeBlanc's track, cued
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Play" })); });
    act(() => dispatch({ type: "DEV_JUMP_LOCATION", id: "ryuji" })); // travel
    await act(async () => { await Promise.resolve(); });
    expect(loads.at(-1)).toEqual(["roof1xxxxxx", false]); // the new location's first track, cued — not playing
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument(); // playback stopped; the user must press play
    expect(screen.getByRole("status").textContent).toBe("TV's off.");
  });
});
