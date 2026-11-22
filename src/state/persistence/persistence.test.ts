import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MINUTE, initialTimer } from "@/domain/timer";
import { initialState, type AppState } from "../store";
import { MAX_BACKUPS, localStorageAdapter, memoryAdapter } from "./adapter";
import { isPersisted } from "./guard";
import { loadPersisted } from "./load";
import { repairTodos, stateFromPersisted, toPersisted } from "./mapping";
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

  it("a backup that cannot be verified makes the visit memory-only, so the main key is never overwritten", () => {
    const adapter = { ...memoryAdapter("{broken"), backup: () => false };
    const r = loadPersisted(adapter, ISO, () => "client-new", defaults);
    expect(r).toMatchObject({ recovered: true, safeToWrite: false });
  });

  it("data from a newer app is backed up but never replaced, even when the backup works", () => {
    const r = load(JSON.stringify({ ...fresh(), schema: 99 }));
    expect(r).toMatchObject({ recovered: true, safeToWrite: false });
    expect(r.adapter.dump().backups).toHaveLength(1);
  });

  it("ordinary corruption with a verified backup is safe to replace", () => {
    expect(load("{nope")).toMatchObject({ recovered: true, safeToWrite: true });
  });

  it.each([
    ["broken JSON", "{not json"],
    ["not an object", "[1,2,3]"],
    ["no schema version", JSON.stringify({ hello: "world" })],
    ["wrong shape for schema 1", JSON.stringify({ ...fresh(), todos: "nope" })],
    ["a bad timer", JSON.stringify({ ...fresh(), timer: { status: "running", durationMs: 1 } })],
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

  it("tells the caller when a write does not reach storage", () => {
    const failing = { ...memoryAdapter(), write: () => false };
    const onFailure = vi.fn();
    const saver = createSaver(failing, 250, onFailure);
    saver.save(fresh());
    vi.advanceTimersByTime(250);
    expect(onFailure).toHaveBeenCalledTimes(1);
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

  it("keeps only the newest backups so repeated recoveries cannot fill the quota", () => {
    let t = NOW;
    const a = localStorageAdapter(STORAGE_KEY, () => (t += 1000));
    for (let i = 0; i < MAX_BACKUPS + 3; i++) expect(a.backup(`copy-${i}`)).toBe(true);
    const kept = Object.keys(window.localStorage).filter((k) => k.startsWith(`${STORAGE_KEY}:backup:`)).sort();
    expect(kept).toHaveLength(MAX_BACKUPS);
    expect(window.localStorage.getItem(kept[0]!)).toBe(`copy-3`); // the oldest three were dropped
  });

  it("reports a failed backup and a failed write instead of pretending they worked (quota exceeded)", () => {
    const a = localStorageAdapter(STORAGE_KEY, () => NOW);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    expect(a.backup("x")).toBe(false);
    expect(a.write("y")).toBe(false);
    expect(a.blocked).toBe(true);
  });

  it("survives blocked storage: reports it, keeps this visit working from memory, never throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const a = localStorageAdapter(STORAGE_KEY, () => NOW);
    expect(a.blocked).toBe(true);
    expect(a.write("kept in memory")).toBe(false);
    expect(a.read()).toBe("kept in memory");
    expect(a.backup("x")).toBe(false);
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

describe("values the guard must refuse", () => {
  const ok = fresh();
  const bad: [string, unknown][] = [
    ["a zero-length timer", { ...ok, timer: { status: "idle", durationMs: 0 } }],
    ["a negative timer", { ...ok, timer: { status: "idle", durationMs: -60_000 } }],
    ["a timer longer than the maximum", { ...ok, timer: { status: "idle", durationMs: 999 * 60_000 } }],
    ["paused time left above the duration", { ...ok, timer: { status: "paused", durationMs: 60_000 * 25, remainingMs: 60_000 * 26 } }],
    ["negative paused time", { ...ok, timer: { status: "paused", durationMs: 60_000 * 25, remainingMs: -1 } }],
    ["a non-integer next todo id", { ...ok, nextTodoId: 1.5 }],
    ["a next todo id below 1", { ...ok, nextTodoId: 0 }],
  ];
  it.each(bad)("rejects %s", (_name, data) => expect(isPersisted(data)).toBe(false));
  it("refuses absurdly large lists instead of trying to process them", () => {
    const huge = Array.from({ length: 5001 }, (_, i) => ({ id: i + 1, text: "t", done: false }));
    expect(isPersisted({ ...ok, todos: huge, nextTodoId: 5002 })).toBe(false);
    expect(isPersisted({ ...ok, visited: Array.from({ length: 5001 }, () => "leblanc") })).toBe(false);
    expect(isPersisted({ ...ok, unreadThreads: Array.from({ length: 5001 }, () => "ann") })).toBe(false);
  });
  it("still accepts a normal log", () => {
    expect(isPersisted({ ...ok, events: [{ kind: "mission_first_set" }, { kind: "session", plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed" }] })).toBe(true);
  });
});

describe("one bad event does not cost the user their history", () => {
  const good = { kind: "session", plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed" } as const;
  const badEvents = [
    { kind: "session", plannedMs: 60_000, focusedMs: 600_000, outcome: "completed" }, // focused above planned
    { kind: "session", plannedMs: 60_000, focusedMs: -5, outcome: "stopped" }, // negative
    { kind: "session", plannedMs: 0, focusedMs: 0, outcome: "stopped" }, // zero-length
    { kind: "dev_grant", knowledge: -50 }, // negative grant
    { kind: "nonsense" },
    42,
  ];

  it("drops only the impossible events and keeps the rest", () => {
    const stored = { ...fresh(), events: [good, ...badEvents, { kind: "mission_first_set" }] };
    const r = load(JSON.stringify(stored));
    expect(r.recovered).toBe(false); // not treated as unreadable data
    const state = stateFromPersisted(r.persisted, NOW, { recovered: false, storageBlocked: false });
    expect(state.events).toEqual([good, { kind: "mission_first_set" }]);
  });
});

describe("a huge stored list cannot crash the app", () => {
  it("cuts a long (but accepted) todo list instead of overflowing the stack", () => {
    const todos = Array.from({ length: 4000 }, (_, i) => ({ id: i + 1, text: `t${i}`, done: false }));
    const r = repairTodos(todos, 4001);
    expect(r.todos).toHaveLength(200);
    expect(r.nextTodoId).toBeGreaterThan(200);
  });

  it("an absurd list is refused at load (backed up, fresh start) rather than processed", () => {
    const todos = Array.from({ length: 300_000 }, (_, i) => ({ id: i + 1, text: "t", done: false }));
    const r = load(JSON.stringify({ ...fresh(), todos, nextTodoId: 300_001 }));
    expect(r.recovered).toBe(true);
    expect(r.adapter.dump().backups).toHaveLength(1);
  });
});

describe("repairing recoverable data on load", () => {
  it("gives duplicate todo ids fresh ones and keeps nextTodoId above every id", () => {
    const r = repairTodos([{ id: 3, text: "a", done: false }, { id: 3, text: "b", done: true }, { id: 7, text: "c", done: false }], 2);
    expect(new Set(r.todos.map((t) => t.id)).size).toBe(3);
    expect(Math.min(...r.todos.map((t) => t.id))).toBe(3);
    expect(r.nextTodoId).toBeGreaterThan(Math.max(...r.todos.map((t) => t.id)));
    expect(r.todos.map((t) => t.text)).toEqual(["a", "b", "c"]);
  });

  it("cuts over-long text, drops empty todos and caps the list", () => {
    const long = "x".repeat(500);
    const r = repairTodos([{ id: 1, text: long, done: false }, { id: 2, text: "   ", done: false }], 3);
    expect(r.todos).toHaveLength(1);
    expect(r.todos[0]!.text).toHaveLength(80);
    const many = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, text: "t", done: false }));
    expect(repairTodos(many, 301).todos).toHaveLength(200);
  });

  it("pulls an end time that is further away than a whole session back to a full session", () => {
    const stored = toPersisted({ ...initialState, timer: { status: "running", durationMs: 25 * MINUTE, endsAt: NOW + 9999 * MINUTE } }, fresh(), ISO);
    const back = stateFromPersisted(stored, NOW, { recovered: false, storageBlocked: false });
    expect(back.timer).toEqual({ status: "running", durationMs: 25 * MINUTE, endsAt: NOW + 25 * MINUTE });
  });

  it("cuts an over-long stored mission", () => {
    const stored = toPersisted({ ...initialState, mission: "m" }, fresh(), ISO);
    const back = stateFromPersisted({ ...stored, mission: { text: "y".repeat(400), setAt: ISO, done: false } }, NOW, { recovered: false, storageBlocked: false });
    expect(back.mission).toHaveLength(80);
  });
});
