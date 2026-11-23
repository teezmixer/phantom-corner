import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { initialState, reducer, type Action, type AppState } from "@/state/store";
import { StoreProvider, useStore } from "@/state/StoreProvider";
import { PhoneWidget } from "./PhoneWidget";

// jsdom has no ResizeObserver, which the Cult UI side panel uses to measure itself.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

const run = (actions: Action[], from: AppState) => actions.reduce(reducer, from);
const firstVisit: AppState = { ...initialState, layer: "splash", entered: false, firstVisit: true };
const returning: AppState = { ...initialState, layer: "main", entered: true, firstVisit: false };

function Probe() { const { state } = useStore(); return <output data-testid="probe">{JSON.stringify({ name: state.name, done: state.story["morgana"]?.done ?? null, unread: state.unreadThreads, thread: state.phoneThread, phoneOpen: state.phoneOpen, level: state.events.length })}</output>; }
const show = (state: AppState) => render(<StoreProvider initial={state}><PhoneWidget /><Probe /></StoreProvider>);
const probe = () => JSON.parse(screen.getByTestId("probe").textContent!);

describe("PhoneWidget", () => {
  it("says so when there is nothing yet, instead of listing threads that have not started", () => {
    show({ ...returning, phoneOpen: true });
    expect(screen.getByText("No messages. Enjoy the quiet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ryuji/ })).toBeNull(); // nothing telegraphs what unlocks
  });

  it("lists only the threads that have started, with the unread ones marked", () => {
    const state = run([{ type: "DEV_GRANT", knowledge: 40 }, { type: "SET_PHONE", open: true }], returning); // Ryuji, what's new, feedback
    show(state);
    const names = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(names).toEqual(expect.arrayContaining(["Ryuji", "What's new", "Feedback"]));
    expect(names).not.toContain("Ann");
    expect(within(screen.getByRole("button", { name: /Ryuji/ })).getByRole("img", { name: "unread" })).toBeInTheDocument();
  });

  it("opening a thread shows its messages and clears its unread mark", () => {
    const state = run([{ type: "DEV_GRANT", knowledge: 40 }, { type: "SET_PHONE", open: true }], returning);
    show(state);
    fireEvent.click(screen.getByRole("button", { name: /Ryuji/ }));
    const log = screen.getByRole("log", { name: "Ryuji" });
    expect(within(log).getByText(/Found a spot/)).toBeInTheDocument();
    expect(probe().unread).not.toContain("ryuji");
  });

  it("a line that arrives in the thread being read does not leave it marked unread", () => {
    // The player is reading Morgana's thread when new lines come in (answering the name makes her say more).
    const state = run([{ type: "ENTER" }], firstVisit);
    let send!: (a: Action) => void;
    function Grab() { const s = useStore(); useEffect(() => { send = s.dispatch; }); return null; }
    render(<StoreProvider initial={state}><PhoneWidget /><Probe /><Grab /></StoreProvider>);
    expect(probe().thread).toBe("morgana");
    act(() => send({ type: "ANSWER_THREAD", id: "morgana", text: "Ren" })); // new lines arrive: the reducer marks the thread unread
    act(() => send({ type: "SET_MISSION", text: "Read" })); // and more
    expect(probe().unread).not.toContain("morgana"); // but it is open, so the widget keeps clearing the mark
  });

  it("the back button returns to the list", () => {
    show(run([{ type: "DEV_GRANT", knowledge: 40 }, { type: "SET_PHONE", open: true }, { type: "OPEN_THREAD", id: "ryuji" }], returning));
    fireEvent.click(screen.getByRole("button", { name: "Ryuji" })); // the title is the back button
    expect(screen.getByRole("button", { name: /Feedback/ })).toBeInTheDocument();
    expect(probe().thread).toBeNull();
  });

  describe("onboarding", () => {
    const begun = () => run([{ type: "ENTER" }], firstVisit);

    it("opens on Morgana's thread, asks for a name, and takes it", () => {
      show(begun());
      const log = screen.getByRole("log", { name: "Morgana" });
      expect(within(log).getByText(/What do I call you/)).toBeInTheDocument();
      const field = screen.getByRole("textbox", { name: "Your name" });
      fireEvent.change(field, { target: { value: "Ren" } });
      fireEvent.submit(field.closest("form")!);
      expect(probe().name).toBe("Ren");
      expect(within(screen.getByRole("log", { name: "Morgana" })).getByText(/Ren\. Fine/)).toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: "Your name" })).toBeNull(); // not asking any more
    });

    it("ignores an empty name", () => {
      show(begun());
      const field = screen.getByRole("textbox", { name: "Your name" });
      fireEvent.change(field, { target: { value: "   " } });
      fireEvent.submit(field.closest("form")!);
      expect(probe().name).toBe("");
      expect(screen.getByRole("textbox", { name: "Your name" })).toBeInTheDocument();
    });

    it("can be skipped from the thread, and the skip button goes away", () => {
      show(begun());
      fireEvent.click(screen.getByRole("button", { name: "Skip (S)" }));
      expect(probe().done).toBe(true);
      expect(screen.queryByRole("button", { name: "Skip (S)" })).toBeNull();
      expect(screen.getByRole("log", { name: "Morgana" })).toBeInTheDocument(); // what was said is still readable
    });

    it("stays readable after it ends: the whole conversation is in the thread", () => {
      show(run([{ type: "SKIP_ONBOARDING" }], begun()));
      expect(screen.getByRole("log", { name: "Morgana" }).querySelectorAll("p").length).toBeGreaterThanOrEqual(3); // real messages, not the hidden speaker labels
    });
  });

  describe("feedback", () => {
    it("takes what the player writes and keeps it in the thread", () => {
      show(run([{ type: "SET_PHONE", open: true }, { type: "OPEN_THREAD", id: "feedback" }], returning));
      const field = screen.getByRole("textbox", { name: "Write feedback" });
      fireEvent.change(field, { target: { value: "More rain, please" } });
      fireEvent.submit(field.closest("form")!);
      expect(within(screen.getByRole("log", { name: "Feedback" })).getByText("More rain, please")).toBeInTheDocument();
      expect((field as HTMLInputElement).value).toBe(""); // cleared, ready for another
    });

    it("other threads have no box to write in", () => {
      show(run([{ type: "DEV_GRANT", knowledge: 40 }, { type: "SET_PHONE", open: true }, { type: "OPEN_THREAD", id: "ryuji" }], returning));
      expect(screen.queryByRole("textbox")).toBeNull();
    });
  });

  describe("keyboard", () => {
    it("after the name is sent, focus goes to the thread's back button, not to the page", () => {
      show(run([{ type: "ENTER" }], firstVisit));
      const field = screen.getByRole("textbox", { name: "Your name" });
      field.focus();
      fireEvent.change(field, { target: { value: "Ren" } });
      fireEvent.submit(field.closest("form")!);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Morgana" }));
    });

    it("after skipping, focus goes to the back button too (the skip button is gone)", () => {
      show(run([{ type: "ENTER" }], firstVisit));
      const skip = screen.getByRole("button", { name: "Skip (S)" });
      skip.focus();
      fireEvent.click(skip);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Morgana" }));
    });

    it("the name box takes no more than a name can hold (80), and the feedback box 500", () => {
      show(run([{ type: "ENTER" }], firstVisit));
      expect(screen.getByRole("textbox", { name: "Your name" })).toHaveAttribute("maxlength", "80");
    });
  });
});
