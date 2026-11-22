import { afterEach, describe, expect, it } from "vitest";
import { analyticsGate, OPT_OUT_KEY, readOptOut, rememberOptOut, setAnalyticsAllowed } from "./telemetry";

const memory = () => {
  const store = new Map<string, string>();
  return { store, getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } };
};

describe("analytics gate (honoured at send time)", () => {
  afterEach(() => setAnalyticsAllowed(true));

  it("passes events on while analytics is on, drops them the moment it is off, and resumes when it is back on", () => {
    const event = { url: "/", type: "pageview" };
    expect(analyticsGate(event)).toBe(event);
    setAnalyticsAllowed(false);
    expect(analyticsGate(event)).toBeNull(); // a script that is already running can no longer send
    setAnalyticsAllowed(true);
    expect(analyticsGate(event)).toBe(event);
  });
});

describe("remembered opt-out", () => {
  it("is stored under a key Delete my data does not match, and cleared when analytics is turned back on", () => {
    const s = memory();
    expect(OPT_OUT_KEY.startsWith("pc:")).toBe(false); // the eraser removes every "pc:" key; this one must survive
    rememberOptOut(true, s);
    expect(readOptOut(s)).toBe(true);
    rememberOptOut(false, s);
    expect(readOptOut(s)).toBe(false);
  });

  it("never throws when storage is blocked", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(() => rememberOptOut(true, blocked)).not.toThrow();
    expect(readOptOut(blocked)).toBe(false);
  });
});
