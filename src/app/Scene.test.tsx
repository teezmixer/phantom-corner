import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialState, type Action } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { Scene } from "./Scene";

const renderScene = (id: string) => render(<StoreProvider initial={initialState}><Scene locationId={id} /></StoreProvider>);
const at = (h: number, m = 0) => new Date(2026, 10, 23, h, m).getTime();

describe("Scene day and night (spec §3.3)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("a place without art shows its day or night variant from the clock, labelled for assistive tech", () => {
    vi.setSystemTime(at(12));
    const { unmount } = renderScene("ryuji");
    expect(screen.getByRole("img")).toHaveAttribute("data-variant", "day");
    expect(screen.getByRole("img").getAttribute("aria-label")).toMatch(/School rooftop, day/);
    unmount();
    vi.setSystemTime(at(22));
    renderScene("ryuji");
    expect(screen.getByRole("img")).toHaveAttribute("data-variant", "night");
    expect(screen.getByRole("img").getAttribute("aria-label")).toMatch(/night/);
  });

  it("switches by itself when the evening comes, without a reload", () => {
    vi.setSystemTime(at(18, 59));
    renderScene("ryuji");
    expect(screen.getByRole("img")).toHaveAttribute("data-variant", "day");
    act(() => { vi.setSystemTime(at(19, 1)); vi.advanceTimersByTime(60_000); });
    expect(screen.getByRole("img")).toHaveAttribute("data-variant", "night");
  });

  it("LeBlanc plays a silent loop and carries the variant (night art is still to come)", () => {
    vi.setSystemTime(at(23));
    renderScene("leblanc");
    const scene = screen.getByLabelText("Background scene");
    const video = scene.querySelector("video") as HTMLVideoElement;
    expect(scene).toHaveAttribute("data-variant", "night");
    expect(video.loop).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.getAttribute("src")).toMatch(/\.mp4$/);
  });

  it("with reduced motion the loop does not start by itself", () => {
    render(<StoreProvider initial={{ ...initialState, motion: "reduced" }}><Scene locationId="leblanc" /></StoreProvider>);
    expect((screen.getByLabelText("Background scene").querySelector("video") as HTMLVideoElement).autoplay).toBe(false);
  });

  it("turning reduced motion on while the loop plays pauses it, and off starts it again", () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    let send!: (a: Action) => void;
    function Grab() { const s = useStore(); useEffect(() => { send = s.dispatch; }); return null; }
    render(<StoreProvider initial={initialState}><Grab /><Scene locationId="leblanc" /></StoreProvider>);
    expect(pause).not.toHaveBeenCalled();
    act(() => send({ type: "SET_MOTION", motion: "reduced" }));
    expect(pause).toHaveBeenCalled();
    play.mockClear();
    act(() => send({ type: "SET_MOTION", motion: "system" }));
    expect(play).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("the room is black, not blank, where the browser cannot play the loop", () => {
    render(<StoreProvider initial={initialState}><Scene locationId="leblanc" /></StoreProvider>);
    expect(screen.getByLabelText("Background scene").className).toContain("bg-black");
  });
});
