import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { answer, stepAll, type Facts } from "@/domain/story";
import { THREADS } from "@/content/threads";
import { initialState, type Action, type AppState } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
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
  it("is not retried once the mission is set: the box goes away and nothing else is given focus", () => {
    render(<StoreProvider initial={askingForMission()}><MissionWidget /></StoreProvider>);
    const box = screen.getByLabelText("Today's mission");
    fireEvent.change(box, { target: { value: "Read" } });
    fireEvent.submit(box.closest("form")!);
    expect(screen.queryByLabelText("Today's mission")).not.toBeInTheDocument();
    expect(document.body).toHaveFocus();
  });
  it("waits for a screen to close when one is open (the widgets are inert then), and takes the cursor when it does", () => {
    let send!: (a: Action) => void;
    function Grab() { const s = useStore(); useEffect(() => { send = s.dispatch; }); return null; }
    render(<StoreProvider initial={{ ...askingForMission(), layer: "settings" }}><Grab /><MissionWidget /></StoreProvider>);
    expect(screen.getByLabelText("Today's mission")).not.toHaveFocus();
    act(() => send({ type: "SET_LAYER", layer: "main" }));
    expect(screen.getByLabelText("Today's mission")).toHaveFocus();
  });
});
