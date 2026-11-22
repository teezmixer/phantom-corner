import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MINUTE, initialTimer } from "@/domain/timer";
import { initialState, type AppState } from "../store";
import { localStorageAdapter, memoryAdapter } from "./adapter";
import { isPersisted } from "./guard";
import { loadPersisted } from "./load";
import { stateFromPersisted, toPersisted } from "./mapping";
import { migrate, type Migration } from "./migrate";
import { freshPersisted, STORAGE_KEY } from "./schema";
import { createSaver } from "./saver";

const NOW = Date.UTC(2026, 10, 22, 12, 0, 0);
const ISO = new Date(NOW).toISOString();
const defaults = { timer: initialTimer, locationId: "leblanc", visited: ["leblanc"] };
const fresh = () => freshPersisted("client-1", ISO, defaults);
const load = (raw: string | null) => {
  const adapter = memoryAdapter(raw);
  return { adapter, ...loadPersisted(adapter, ISO, () => "client-new", defaults) };
};

describe("load path", () => {
  it("starts fresh on a first visit without calling it a recovery", () => {
    const r = load(null);
    expect(r).toMatchObject({ recovered: false, firstVisit: true });
    expect(r.persisted.clientId).toBe("client-new");
    expect(isPersisted(r.persisted)).toBe(true);
  });

  it("round-trips valid stored data untouched", () => {
    const stored = { ...fresh(), name: "Ren", mission: { text: "Read", setAt: ISO, done: false } };
    const r = load(JSON.stringify(stored));
    expect(r).toMatchObject({ recovered: false, firstVisit: false });
    expect(r.persisted).toEqual(stored);
  });

  it.each([
    ["broken JSON", "{not json"],
    ["not an object", "[1,2,3]"],
    ["no schema version", JSON.stringify({ hello: "world" })],
    ["wrong shape for schema 1", JSON.stringify({ ...fresh(), todos: "nope" })],
    ["a bad timer", JSON.stringify({ ...fresh(), timer: { status: "running", durationMs: 1 } })],
    ["a bad event", JSON.stringify({ ...fresh(), events: [{ kind: "session", plannedMs: 1 }] })],
    ["data from a newer app", JSON.stringify({ ...fresh(), schema: 99 })],
  ])("backs up %s and starts fresh with recovered set", (_name, raw) => {
    const r = load(raw);
    expect(r.recovered).toBe(true);
    expect(r.adapter.dump().backups).toEqual([raw]);
    expect(isPersisted(r.persisted)).toBe(true);
    expect(r.persisted.clientId).toBe("client-new");
  });
});

describe("migrations", () => {
  const up: Migration = (d) => ({ ...d, added: true });
  const up2: Migration = (d) => ({ ...d, addedAgain: (d.added as boolean) === true });

  it("runs each step from the stored version up to the current one", () => {
    expect(migrate({ schema: 1 }, [up, up2])).toEqual({ schema: 3, added: true, addedAgain: true });
    expect(migrate({ schema: 2, added: true }, [up, up2])).toEqual({ schema: 3, added: true, addedAgain: true });
  });

  it("leaves current data alone and rejects newer, versionless or non-object data", () => {
    expect(migrate({ schema: 1, x: 1 }, [])).toEqual({ schema: 1, x: 1 });
    expect(() => migrate({ schema: 5 }, [up])).toThrow(/newer/);
    expect(() => migrate({ nope: true })).toThrow(/schema version/);
    expect(() => migrate(null)).toThrow();
  });
});

describe("saver", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounces: many saves inside 250 ms write once, with the last value", () => {
    const adapter = memoryAdapter();
    const saver = createSaver(adapter, 250);
    saver.save({ ...fresh(), name: "a" });
    vi.advanceTimersByTime(200);
    saver.save({ ...fresh(), name: "b" });
    vi.advanceTimersByTime(249);
    expect(adapter.dump().raw).toBeNull();
    vi.advanceTimersByTime(1);
    expect(JSON.parse(adapter.dump().raw!).name).toBe("b");
  });

  it("flush writes immediately and cancel drops a queued write", () => {
    const adapter = memoryAdapter();
    const saver = createSaver(adapter);
    saver.save({ ...fresh(), name: "now" });
    saver.flush();
    expect(JSON.parse(adapter.dump().raw!).name).toBe("now");
    saver.save({ ...fresh(), name: "never" });
    saver.cancel();
    vi.advanceTimersByTime(1000);
    expect(JSON.parse(adapter.dump().raw!).name).toBe("now");
  });
});

describe("localStorageAdapter", () => {
  afterEach(() => { vi.restoreAllMocks(); window.localStorage.clear(); });

  it("reads, writes and backs up under a dated key", () => {
    const a = localStorageAdapter(STORAGE_KEY, () => NOW);
    expect(a.blocked).toBe(false);
    a.write("hello");
    expect(a.read()).toBe("hello");
    a.backup("old");
    expect(window.localStorage.getItem(`${STORAGE_KEY}:backup:${ISO}`)).toBe("old");
  });

  it("survives blocked storage: reports it, keeps this visit working from memory, never throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const a = localStorageAdapter(STORAGE_KEY, () => NOW);
    expect(a.blocked).toBe(true);
    expect(() => a.write("kept in memory")).not.toThrow();
    expect(a.read()).toBe("kept in memory");
    expect(() => a.backup("x")).not.toThrow();
  });
});

describe("state ↔ persisted", () => {
  const live: AppState = {
    ...initialState,
    entered: true, layer: "map", phoneOpen: true, hudHidden: true,
    name: "Ren", mission: "Finish chapter 3", todos: [{ id: 1, text: "read", done: true }], nextTodoId: 2,
    timer: { status: "running", durationMs: 25 * MINUTE, endsAt: NOW + 10 * MINUTE },
    events: [{ kind: "mission_first_set" }], visited: ["leblanc", "ryuji"], locationId: "ryuji", unreadThreads: ["ann"], muted: true,
  };

  it("stores only durable state — never the layer, open phone or hidden HUD", () => {
    const p = toPersisted(live, fresh(), ISO);
    expect(isPersisted(p)).toBe(true);
    expect(JSON.stringify(p)).not.toMatch(/layer|phoneOpen|hudHidden/);
  });

  it("restores everything to a fresh visit at the splash", () => {
    const back = stateFromPersisted(toPersisted(live, fresh(), ISO), NOW, { recovered: false, storageBlocked: false });
    expect(back).toMatchObject({ layer: "splash", entered: false, phoneOpen: false, hudHidden: false });
    expect(back).toMatchObject({ name: "Ren", mission: "Finish chapter 3", locationId: "ryuji", visited: ["leblanc", "ryuji"], muted: true, unreadThreads: ["ann"], nextTodoId: 2 });
    expect(back.todos).toEqual(live.todos);
  });

  it("resumes a running timer with the correct time left", () => {
    const back = stateFromPersisted(toPersisted(live, fresh(), ISO), NOW + 4 * MINUTE, { recovered: false, storageBlocked: false });
    expect(back.timer).toEqual({ status: "running", durationMs: 25 * MINUTE, endsAt: NOW + 10 * MINUTE });
  });

  it("counts a session that ended while the tab was closed, and waits at the choice", () => {
    const stored = toPersisted(live, fresh(), ISO);
    const back = stateFromPersisted(stored, NOW + 11 * MINUTE, { recovered: false, storageBlocked: false });
    expect(back.timer.status).toBe("complete");
    expect(back.events.at(-1)).toEqual({ kind: "session", plannedMs: 25 * MINUTE, focusedMs: 25 * MINUTE, outcome: "completed" });
  });

  it("keeps a paused timer paused however long the tab was closed", () => {
    const paused: AppState = { ...live, timer: { status: "paused", durationMs: 25 * MINUTE, remainingMs: 7 * MINUTE } };
    const back = stateFromPersisted(toPersisted(paused, fresh(), ISO), NOW + 999 * MINUTE, { recovered: false, storageBlocked: false });
    expect(back.timer).toEqual(paused.timer);
  });

  it("passes the recovery and blocked-storage flags through", () => {
    expect(stateFromPersisted(fresh(), NOW, { recovered: true, storageBlocked: true })).toMatchObject({ recovered: true, storageBlocked: true });
  });

  it("moves a stamp only when its slice changed", () => {
    const base = toPersisted({ ...initialState }, fresh(), ISO);
    const later = new Date(NOW + 5000).toISOString();
    const missionOnly = toPersisted({ ...initialState, mission: "x" }, base, later);
    expect(missionOnly.stamps).toEqual({ settings: ISO, mission: later, todos: ISO });
    const todosOnly = toPersisted({ ...initialState, todos: [{ id: 1, text: "t", done: false }] }, base, later);
    expect(todosOnly.stamps).toEqual({ settings: ISO, mission: ISO, todos: later });
    const settingsOnly = toPersisted({ ...initialState, muted: true }, base, later);
    expect(settingsOnly.stamps).toEqual({ settings: later, mission: ISO, todos: ISO });
  });

  it("keeps the mission's setAt when only its done flag changes", () => {
    const withMission = toPersisted({ ...initialState, mission: "x" }, fresh(), ISO);
    const done = toPersisted({ ...initialState, mission: "x", missionDone: true }, withMission, new Date(NOW + 9000).toISOString());
    expect(done.mission).toEqual({ text: "x", setAt: ISO, done: true });
  });
});
