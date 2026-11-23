import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { answer, stepAll, type Facts } from "@/domain/story";
import { THREADS } from "@/content/threads";
import { initialState, type AppState } from "@/state/store";
import { StoreProvider } from "@/state/StoreProvider";
import { MissionWidget } from "./MissionWidget";

const facts: Facts = { entered: true, firstVisit: true, name: "", missionSet: false, sessionsCompleted: 0, visited: ["leblanc"], unlocked: ["leblanc"], saveOffer: false, release: "", defaultName: "Student Ren" };
const morgana = THREADS.filter((t) => t.id === "morgana");
/** The state when Morgana has just been given a name and is asking for the mission. */
function askingForMission(): AppState {
  const asked = stepAll(morgana, {}, facts).progress;
  const named = { ...asked, morgana: answer(morgana[0]!, asked["morgana"]!, "Ren", "Ren") };
  return { ...initialState, entered: true, layer: "main", firstVisit: true, name: "Ren", story: stepAll(morgana, named, { ...facts, name: "Ren" }).progress };
}

describe("the mission box during onboarding", () => {
  it("takes the cursor once Morgana has the name and is asking for the mission", () => {
    render(<StoreProvider initial={askingForMission()}><MissionWidget /></StoreProvider>);
    expect(screen.getByLabelText("Today's mission")).toHaveFocus();
  });
  it("does not grab focus before the name is given, or for a player who is not being onboarded", () => {
    const noName = { ...askingForMission(), name: "" };
    const { unmount } = render(<StoreProvider initial={noName}><MissionWidget /></StoreProvider>);
    expect(screen.getByLabelText("Today's mission")).not.toHaveFocus();
    unmount();
    render(<StoreProvider initial={{ ...initialState, entered: true, layer: "main", name: "Ren" }}><MissionWidget /></StoreProvider>);
    expect(screen.getByLabelText("Today's mission")).not.toHaveFocus();
  });
  it("does not keep stealing focus once the mission is set", () => {
    const { rerender } = render(<StoreProvider initial={askingForMission()}><MissionWidget /></StoreProvider>);
    act(() => { (document.activeElement as HTMLElement).blur(); });
    rerender(<StoreProvider initial={askingForMission()}><MissionWidget /></StoreProvider>);
    expect(screen.getByLabelText("Today's mission")).not.toHaveFocus();
  });
});
