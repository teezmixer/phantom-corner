import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StampCalendar } from "./StampCalendar";

const NOW = new Date(2026, 10, 23, 14).getTime(); // Monday 23 November 2026
const cell = (day: string) => document.querySelector<HTMLElement>(`[data-day="${day}"]`)!;

describe("StampCalendar", () => {
  it("shows the current month, Monday first, with every day of it", () => {
    render(<StampCalendar days={[]} now={NOW} />);
    expect(screen.getByRole("heading", { name: "November 2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
    expect(document.querySelectorAll("[data-day]")).toHaveLength(30);
    expect(cell("2026-11-01")).toBeInTheDocument();
    expect(cell("2026-11-30")).toBeInTheDocument();
  });

  it("puts a stamp on each studied day and on no other", () => {
    render(<StampCalendar days={[{ day: "2026-11-20", style: 0 }, { day: "2026-11-23", style: 1 }]} now={NOW} />);
    expect([...document.querySelectorAll("[data-stamp]")].map((c) => c.getAttribute("data-day"))).toEqual(["2026-11-20", "2026-11-23"]);
    expect(cell("2026-11-21")).not.toHaveAttribute("data-stamp");
  });

  it("each stamp uses the design it was stamped with", () => {
    render(<StampCalendar days={[{ day: "2026-11-20", style: 0 }, { day: "2026-11-21", style: 1 }, { day: "2026-11-22", style: 5 }]} now={NOW} />);
    expect(cell("2026-11-20")).toHaveAttribute("data-stamp", "stamp");
    expect(cell("2026-11-21")).toHaveAttribute("data-stamp", "star");
    expect(cell("2026-11-22")).toHaveAttribute("data-stamp", "crown");
  });

  it("announces a stamped day to a screen reader, and marks today", () => {
    render(<StampCalendar days={[{ day: "2026-11-23", style: 0 }]} now={NOW} />);
    expect(within(cell("2026-11-23")).getByText("23, studied")).toBeInTheDocument();
    expect(cell("2026-11-23")).toHaveAttribute("aria-current", "date");
    expect(document.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
  });

  it("moves between months, and stamps stay on their own month", () => {
    render(<StampCalendar days={[{ day: "2026-10-31", style: 0 }]} now={NOW} />);
    expect(document.querySelectorAll("[data-stamp]")).toHaveLength(0); // November has none
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("heading", { name: "October 2026" })).toBeInTheDocument();
    expect(cell("2026-10-31")).toHaveAttribute("data-stamp", "stamp");
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("heading", { name: "December 2026" })).toBeInTheDocument();
  });

  it("has no counter and no streak, with or without stamps (spec §3.4)", () => {
    const { container, rerender } = render(<StampCalendar days={[]} now={NOW} />);
    const many = Array.from({ length: 10 }, (_, i) => ({ day: `2026-11-${String(i + 10).padStart(2, "0")}`, style: 0 }));
    rerender(<StampCalendar days={many} now={NOW} />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/streak|in a row|consecutive|broken|\bdays? studied\b|\d+\s*days/i);
  });
});
