import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { initialState, type AppState } from "@/state/store";
import { StoreProvider } from "@/state/StoreProvider";
import { LevelWidget } from "./LevelWidget";

const show = (state: Partial<AppState>) => render(<StoreProvider initial={{ ...initialState, ...state }}><LevelWidget /></StoreProvider>);
const group = () => screen.getByRole("group", { name: "Level and Knowledge" });

describe("LevelWidget", () => {
  it("shows level 1 and 0 Knowledge for a new user", () => {
    show({});
    expect(group()).toHaveTextContent(/Lv\s*1/);
    expect(group()).toHaveTextContent(/Knowledge\s*0/);
    expect(screen.getByRole("progressbar", { name: "Progress to the next level" })).toBeInTheDocument();
  });

  it("derives level and Knowledge from the event log (a first mission + a full session = 40, level 3)", () => {
    show({ events: [{ kind: "mission_first_set" }, { kind: "session", plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed" }] });
    expect(group()).toHaveTextContent(/Lv\s*3/);
    expect(group()).toHaveTextContent(/Knowledge\s*40/);
  });

  it("shows a full bar at the highest level", () => {
    show({ events: [{ kind: "dev_grant", knowledge: 999_999 }] });
    expect(group()).toHaveTextContent(/Lv\s*29/);
    expect(screen.getByRole("progressbar", { name: "Progress to the next level" })).toHaveAttribute("aria-valuenow", "100");
  });
});
