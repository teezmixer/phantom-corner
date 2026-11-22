import { describe, expect, it } from "vitest";
import { initialState } from "@/state/store";
import { remainingMs } from "@/domain/timer";
import { buildInitialState, parseMode } from "./initialState";

const NOW = 1_700_000_000_000;

describe("parseMode", () => {
  it("reads demo, dev and at", () => {
    expect(parseMode("?demo=true&at=summary")).toEqual({ demo: true, dev: false, at: "summary" });
    expect(parseMode("?dev=true")).toEqual({ demo: false, dev: true, at: null });
    expect(parseMode("")).toEqual({ demo: false, dev: false, at: null });
    expect(parseMode("?demo=1").demo).toBe(false); // only the literal "true" counts
  });
});

describe("buildInitialState", () => {
  it("starts at the splash on a normal visit", () => {
    expect(buildInitialState(parseMode(""), NOW)).toBe(initialState);
  });

  it("demo lands mid-session: ~17 minutes left, a mission, two todos, one unread message", () => {
    const s = buildInitialState(parseMode("?demo=true"), NOW);
    expect(s).toMatchObject({ demo: true, layer: "main", entered: true, mission: "Finish chapter 3", unreadThreads: ["morgana"] });
    expect(s.todos).toHaveLength(2);
    expect(remainingMs(s.timer, NOW)).toBe(17 * 60_000);
  });

  it("demo can open on the summary or the menu", () => {
    expect(buildInitialState(parseMode("?demo=true&at=summary"), NOW).layer).toBe("summary");
    expect(buildInitialState(parseMode("?demo=true&at=menu"), NOW).layer).toBe("menu");
    expect(buildInitialState(parseMode("?demo=true&at=nonsense"), NOW).layer).toBe("main");
  });

  it("ignores at= outside demo mode", () => {
    expect(buildInitialState(parseMode("?at=summary"), NOW)).toBe(initialState);
  });
});
