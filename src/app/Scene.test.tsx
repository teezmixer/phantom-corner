import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Scene } from "./Scene";

const at = (h: number, m = 0) => new Date(2026, 10, 23, h, m).getTime();

describe("Scene day and night (spec §3.3)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("a place without art shows its day or night variant from the clock, labelled for assistive tech", () => {
    vi.setSystemTime(at(12));
    const { unmount } = render(<Scene locationId="ryuji" />);
    expect(screen.getByRole("img")).toHaveAttribute("data-variant", "day");
    expect(screen.getByRole("img").getAttribute("aria-label")).toMatch(/School rooftop, day/);
    unmount();
    vi.setSystemTime(at(22));
    render(<Scene locationId="ryuji" />);
    expect(screen.getByRole("img")).toHaveAttribute("data-variant", "night");
    expect(screen.getByRole("img").getAttribute("aria-label")).toMatch(/night/);
  });

  it("switches by itself when the evening comes, without a reload", () => {
    vi.setSystemTime(at(18, 59));
    render(<Scene locationId="ryuji" />);
    expect(screen.getByRole("img")).toHaveAttribute("data-variant", "day");
    act(() => { vi.setSystemTime(at(19, 1)); vi.advanceTimersByTime(60_000); });
    expect(screen.getByRole("img")).toHaveAttribute("data-variant", "night");
  });

  it("LeBlanc keeps its background and carries the variant (night art is still to come)", () => {
    vi.setSystemTime(at(23));
    render(<Scene locationId="leblanc" />);
    expect(screen.getByAltText("Background scene")).toHaveAttribute("data-variant", "night");
  });
});
