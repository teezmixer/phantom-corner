import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OPT_OUT_KEY } from "@/app/telemetry";
import { HOME_LOCATION_ID } from "@/content/registry";
import { initialTimer } from "@/domain/timer";
import { StoreProvider, useStore } from "../StoreProvider";
import { initialState, type Action } from "../store";
import { memoryAdapter } from "./adapter";
import { freshPersisted } from "./schema";

const NOW = "2026-11-22T12:00:00.000Z";
const base = () => freshPersisted("client-1", NOW, { timer: initialTimer, locationId: HOME_LOCATION_ID, visited: [HOME_LOCATION_ID] });

function setup(enabled = true) {
  const adapter = memoryAdapter();
  const persistence = { adapter, base: base(), enabled };
  let dispatch!: (a: Action) => void;
  let wipe!: () => void;
  let persistent!: boolean;
  function Grab() {
    const s = useStore();
    useEffect(() => { dispatch = s.dispatch; wipe = s.wipe; persistent = s.persistent; });
    return null;
  }
  const initial = { ...initialState };
  render(<StoreProvider initial={initial} persistence={persistence}><Grab /></StoreProvider>);
  return { adapter, send: (a: Action) => act(() => dispatch(a)), wipe: () => act(() => wipe()), persistent: () => persistent };
}

describe("persistence: what is saved, and Delete", () => {
  beforeEach(() => { vi.useFakeTimers(); window.localStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("saves nothing for a visit where nothing changed, so a visitor who only sees the splash leaves no trace", () => {
    const { adapter } = setup();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(adapter.dump().raw).toBeNull();
  });

  it("saves as soon as something changes (muting counts)", () => {
    const { adapter, send } = setup();
    send({ type: "TOGGLE_MUTE" });
    act(() => { vi.advanceTimersByTime(300); });
    expect(JSON.parse(adapter.dump().raw!).settings.muted).toBe(true);
  });

  it("reports whether progress is being saved (demo and locked tabs are not)", () => {
    expect(setup(true).persistent()).toBe(true);
  });

  it("wipe() cancels a queued save, erases every pc: key (backups too), keeps the opt-out marker, and reloads — and nothing is written back", () => {
    const reload = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, reload } as unknown as Location);
    window.localStorage.setItem("pc:v1", "old save");
    window.localStorage.setItem("pc:v1:backup:2026", "old backup");
    window.localStorage.setItem(OPT_OUT_KEY, "1");
    window.localStorage.setItem("unrelated", "keep");
    const { adapter, send, wipe } = setup();
    send({ type: "SET_MISSION", text: "pending change" }); // queued, not yet written
    wipe();
    expect(window.localStorage.getItem("pc:v1")).toBeNull();
    expect(window.localStorage.getItem("pc:v1:backup:2026")).toBeNull();
    expect(window.localStorage.getItem(OPT_OUT_KEY)).toBe("1"); // the one choice that outlives a delete
    expect(window.localStorage.getItem("unrelated")).toBe("keep");
    expect(reload).toHaveBeenCalledTimes(1);
    send({ type: "SET_MISSION", text: "even later" });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(adapter.dump().raw).toBeNull(); // the queued save was cancelled and later changes are not written
    expect(window.localStorage.getItem("pc:v1")).toBeNull();
  });
});
