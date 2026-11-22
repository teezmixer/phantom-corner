import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Root } from "./Root";
import { parseMode } from "./initialState";

// The room itself is not under test here, only WHEN saved data is read relative to the session lock.
vi.mock("./App", () => ({ App: () => <p>the room</p> }));

type LockCallback = (lock: { name: string } | null) => Promise<void> | void;

describe("Root: saved data is read only after the session lock is held", () => {
  let grant: (() => void) | undefined;
  let getItem: { mock: { calls: unknown[][] } };

  beforeEach(() => {
    // A lock that stays pending until the test grants it (as when another tab still owns it).
    const request = vi.fn((_name: string, _options: unknown, callback: LockCallback) =>
      new Promise<void>((resolve) => { grant = () => { void callback({ name: "pc:session" }); resolve(); }; }),
    );
    Object.defineProperty(navigator, "locks", { value: { request }, configurable: true });
    window.localStorage.setItem("pc:v1", "{}");
    getItem = vi.spyOn(Storage.prototype, "getItem") as unknown as typeof getItem;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    delete (navigator as unknown as { locks?: unknown }).locks;
  });

  it("does not touch the stored data while waiting for the lock, and reads it once the lock is granted", () => {
    render(<Root mode={parseMode("")} />);
    expect(screen.queryByText("the room")).not.toBeInTheDocument();
    const readsBefore = getItem.mock.calls.filter((call) => call[0] === "pc:v1").length;
    expect(readsBefore).toBe(0); // a waiting tab has not loaded a stale copy

    act(() => grant?.());
    expect(screen.getByText("the room")).toBeInTheDocument();
    expect(getItem.mock.calls.filter((call) => call[0] === "pc:v1").length).toBeGreaterThan(0);
  });

  it("demo mode never waits for, or takes, the lock", () => {
    const request = (navigator as unknown as { locks: { request: ReturnType<typeof vi.fn> } }).locks.request;
    render(<Root mode={parseMode("?demo=true")} />);
    expect(screen.getByText("the room")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });
});
