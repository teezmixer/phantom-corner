import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialState } from "@/state/store";
import { StoreProvider } from "@/state/StoreProvider";
import { DateTimeWidget } from "./DateTimeWidget";

const clock = () => document.querySelector("time")!;
const show = () => render(<StoreProvider initial={{ ...initialState }}><DateTimeWidget /></StoreProvider>);

describe("DateTimeWidget", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the date, weekday, time-of-day label and a live clock — and no weather", () => {
    vi.setSystemTime(new Date(2026, 10, 22, 20, 5)); // Sunday evening
    show();
    expect(screen.getByLabelText("11/22")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
    expect(screen.getByText("Evening")).toBeInTheDocument();
    expect(clock()).toHaveAttribute("datetime", "20:05");
    expect(clock().textContent).toBe("20:05");
    expect(document.body.textContent).not.toMatch(/weather|°|rain|sunny/i);
  });

  it("moves the clock on as time passes and changes the time-of-day label", () => {
    vi.setSystemTime(new Date(2026, 10, 22, 10, 59));
    show();
    expect(screen.getByText("Morning")).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(61_000); }); // 11:00 → daytime
    expect(screen.getByText("Daytime")).toBeInTheDocument();
    expect(clock()).toHaveAttribute("datetime", "11:00");
    // (The visible digits roll to the new value with a spring that jsdom cannot step; the real rolling is covered in e2e.)
  });
});
