import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ui } from "@/content/copy";
import { dayKey } from "@/domain/calendar";
import { initialState, type AppState } from "@/state/store";
import { StoreProvider } from "@/state/StoreProvider";
import { ProfileScreen } from "./ProfileScreen";

const show = (patch: Partial<AppState> = {}) =>
  render(<StoreProvider initial={{ ...initialState, entered: true, layer: "profile", ...patch }}><ProfileScreen /></StoreProvider>);
const t = ui.profile;

describe("Profile (spec §3.2)", () => {
  it("shows the portrait slot, the name and every total", () => {
    show({ name: "Ren", events: [{ kind: "session", plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed" }] });
    expect(screen.getByRole("img", { name: t.portrait })).toBeInTheDocument();
    expect(screen.getByText("Ren")).toBeInTheDocument();
    for (const label of [t.knowledge, t.level, t.sessions, t.minutes]) expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(t.minutes).nextSibling).toHaveTextContent("25");
    expect(screen.getByText(t.sessions).nextSibling).toHaveTextContent("1");
  });

  it("says since when, when it is known, and says nothing rather than guess when it is not", () => {
    show({ memberSince: "2026-03-05T10:00:00.000Z" });
    const since = screen.getByText(t.memberSince).closest("p")!;
    expect(within(since).getByText(/2026/)).toHaveAttribute("datetime", "2026-03-05T10:00:00.000Z");
  });
  it("has no member-since line when it is unknown", () => {
    show({ memberSince: null });
    expect(screen.queryByText(t.memberSince)).not.toBeInTheDocument();
  });

  it("carries the calendar, with today's stamp, and the roster of places unlocked", () => {
    show({ studiedDays: [{ day: dayKey(Date.now()), style: 0 }], events: [{ kind: "dev_grant", knowledge: 500 }] });
    expect(screen.getByRole("region", { name: ui.calendar.label })).toBeInTheDocument();
    const roster = screen.getByRole("region", { name: t.roster });
    expect(within(roster).getByText(/Leblanc/i)).toBeInTheDocument();
    expect(within(roster).getAllByRole("listitem").length).toBeGreaterThan(1); // a level-10 player has opened more than the café
  });
});
