import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MINUTE, initialTimer } from "@/domain/timer";
import { initialState, reducer, type AppState } from "../store";
import { MAX_BACKUPS, localStorageAdapter, memoryAdapter } from "./adapter";
import { isEvent, isPersisted } from "./guard";
import { loadPersisted } from "./load";
import { repairTodos, stateFromPersisted, toPersisted } from "./mapping";
import { THREADS } from "@/content/threads";
import { repairStory } from "./repair";
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

describe("the real migrations 1 → 2 → 3 → 4 → 5 (existing users keep their progress)", () => {
  // Exactly what M3 wrote to localStorage.
  const v1 = {
    schema: 1, clientId: "old-client", name: "Ren", settings: { muted: true },
    mission: { text: "Finish chapter 3", setAt: ISO, done: false },
    todos: [{ id: 1, text: "read", done: false }], nextTodoId: 2,
    timer: { status: "idle", durationMs: 25 * 60_000 }, locationId: "ryuji", visited: ["leblanc", "ryuji"],
    events: [{ kind: "mission_first_set" }, { kind: "session", plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed" }],
    unreadThreads: ["ann"], stamps: { settings: ISO, mission: ISO, todos: ISO },
  };

  const PREFS = { hidden: [], hudSize: 1, motion: "system", analytics: true, todoCollapsed: false };

  it("loads a schema-2 save (exactly what M4 wrote) as schema 5, keeping volumes and everything else", () => {
    const v2 = { ...v1, schema: 2, settings: { muted: true, volumes: { music: 0.2, ambience: 0.9, ui: 0.1 }, ambienceMix: { "leblanc-rain": 0.4 } } };
    const r = load(JSON.stringify(v2));
    expect(r.recovered).toBe(false);
    expect(r.adapter.dump().backups).toEqual([]);
    expect(r.persisted.schema).toBe(5);
    expect(r.persisted.story).toEqual({});
    expect(r.persisted.studiedDays).toEqual([]);
    expect(r.persisted.settings).toEqual({ muted: true, volumes: { music: 0.2, ambience: 0.9, ui: 0.1 }, ambienceMix: { "leblanc-rain": 0.4 }, ...PREFS });
    expect(r.persisted).toMatchObject({ name: "Ren", locationId: "ryuji", unreadThreads: ["ann"] });
  });

  it("loads a schema-1 save as schema 5 without treating it as unreadable, keeping everything", () => {
    const r = load(JSON.stringify(v1));
    expect(r.recovered).toBe(false);
    expect(r.adapter.dump().backups).toEqual([]);
    expect(r.persisted).toMatchObject({ schema: 5, studiedDays: [], story: {}, clientId: "old-client", name: "Ren", locationId: "ryuji", visited: ["leblanc", "ryuji"], unreadThreads: ["ann"] });
    expect(r.persisted.events).toHaveLength(2);
    expect(r.persisted.settings).toEqual({ muted: true, volumes: { music: 0.5, ambience: 0.35, ui: 0.7 }, ambienceMix: {}, ...PREFS });
  });

  it("loads a schema-3 save (what M5 and M6 wrote) as schema 5: nothing lost, the calendar and the story start empty", () => {
    const v3 = { ...v1, schema: 3, settings: { muted: false, volumes: { music: 0.3, ambience: 0.3, ui: 0.3 }, ambienceMix: {}, ...PREFS, hudSize: 1.3 } };
    const r = load(JSON.stringify(v3));
    expect(r.recovered).toBe(false);
    expect(r.adapter.dump().backups).toEqual([]);
    expect(r.persisted).toMatchObject({ schema: 5, studiedDays: [], story: {}, name: "Ren", locationId: "ryuji" });
    expect(r.persisted.settings.hudSize).toBe(1.3);
    expect(r.persisted.events).toHaveLength(2); // the sessions are kept; they just have no date
  });

  it("upgrades a schema-1 save whose settings are missing or damaged instead of throwing it away", () => {
    for (const settings of [undefined, null, "oops", {}, { muted: "yes" }]) {
      const r = load(JSON.stringify({ ...v1, settings }));
      expect(r.recovered, JSON.stringify(settings)).toBe(false);
      expect(r.persisted.settings.muted).toBe(false);
      expect(r.persisted.settings.volumes).toEqual({ music: 0.5, ambience: 0.35, ui: 0.7 });
      expect(r.persisted.name).toBe("Ren"); // the rest of the save is intact
    }
  });

  it("is idempotent: migrating an already-migrated save changes nothing", () => {
    const once = load(JSON.stringify(v1)).persisted;
    const twice = load(JSON.stringify(once)).persisted;
    expect(twice).toEqual(once);
  });

  it("round-trips the preferences and the mission deadline through the app state", () => {
    const state: AppState = { ...initialState, mission: "x", missionDeadline: ISO, hiddenWidgets: ["timer", "level"], hudSize: 1.3, motion: "reduced", analytics: false, todoCollapsed: true };
    const stored = toPersisted(state, fresh(), ISO);
    expect(stored.mission).toEqual({ text: "x", setAt: ISO, done: false, deadline: ISO });
    const back = stateFromPersisted(stored, NOW, { recovered: false, storageBlocked: false });
    expect(back).toMatchObject({ missionDeadline: ISO, hiddenWidgets: ["timer", "level"], hudSize: 1.3, motion: "reduced", analytics: false, todoCollapsed: true });
  });

  it("round-trips volumes and the ambience mix through the app state", () => {
    const state: AppState = { ...initialState, volumes: { music: 0.2, ambience: 0.9, ui: 0.1 }, ambienceMix: { "leblanc-rain": 0.25 } };
    const back = stateFromPersisted(toPersisted(state, fresh(), ISO), NOW, { recovered: false, storageBlocked: false });
    expect(back.volumes).toEqual(state.volumes);
    expect(back.ambienceMix).toEqual(state.ambienceMix);
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

  it("does not add another backup of data that is already the newest backup", () => {
    let t = NOW;
    const a = localStorageAdapter(STORAGE_KEY, () => (t += 1000));
    for (let i = 0; i < MAX_BACKUPS + 3; i++) expect(a.backup("same unreadable text")).toBe(true); // reloading at the splash again and again
    expect(Object.keys(window.localStorage).filter((k) => k.startsWith(`${STORAGE_KEY}:backup:`))).toHaveLength(1);
    expect(a.backup("something different")).toBe(true);
    expect(Object.keys(window.localStorage).filter((k) => k.startsWith(`${STORAGE_KEY}:backup:`))).toHaveLength(2);
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

describe("one bad preference does not cost the user their save", () => {
  const stored = (patch: object, mission?: object) => ({ ...fresh(), name: "Ren", events: [{ kind: "mission_first_set" }], settings: { ...fresh().settings, ...patch }, ...(mission ? { mission } : {}) });
  const loadState = (data: unknown) => {
    const r = load(JSON.stringify(data));
    return { r, state: stateFromPersisted(r.persisted, NOW, { recovered: r.recovered, storageBlocked: false }) };
  };

  it.each([
    ["an impossible HUD size", { hudSize: 2 }, "hudSize", 1],
    ["a negative HUD size", { hudSize: -1 }, "hudSize", 1],
    ["an unknown motion value", { motion: "loud" }, "motion", "system"],
    ["a non-boolean analytics switch", { analytics: "yes" }, "analytics", true],
    ["a non-boolean collapsed todo", { todoCollapsed: 5 }, "todoCollapsed", false],
  ])("loads the save and falls back to the default for %s", (_name, patch, field, expected) => {
    const { r, state } = loadState(stored(patch));
    expect(r.recovered).toBe(false); // not treated as unreadable data
    expect(r.adapter.dump().backups).toEqual([]);
    expect((state as unknown as Record<string, unknown>)[field]).toEqual(expected);
    expect(state.name).toBe("Ren"); // progress survives
    expect(state.events).toHaveLength(1);
  });

  it("drops widgets that may not be hidden (the TV, the button bar, unknown ids) and duplicates, keeping the valid ones", () => {
    const { state } = loadState(stored({ hidden: ["timer", "music", "buttonBar", "nope", "timer", "todo", 7] }));
    expect(state.hiddenWidgets).toEqual(["timer", "todo"]);
    expect(loadState(stored({ hidden: "everything" })).state.hiddenWidgets).toEqual([]);
  });

  it("clamps out-of-range volumes and mix levels, and drops unreadable ones", () => {
    const { state } = loadState(stored({ volumes: { music: 1.5, ambience: -1, ui: "loud" }, ambienceMix: { rain: 2, murmur: "x", wind: 0.4 } }));
    expect(state.volumes).toEqual({ music: 1, ambience: 0, ui: 0.7 }); // clamped, clamped, default
    expect(state.ambienceMix).toEqual({ rain: 1, wind: 0.4 });
  });

  it("keeps the mission but drops a deadline that is not a date", () => {
    const { state } = loadState(stored({}, { text: "Keep me", setAt: ISO, done: false, deadline: "not a date" }));
    expect(state.mission).toBe("Keep me");
    expect(state.missionDeadline).toBeNull();
    expect(loadState(stored({}, { text: "x", setAt: ISO, done: false, deadline: ISO })).state.missionDeadline).toBe(ISO);
  });

  it("still refuses a save whose settings are not an object at all", () => {
    expect(load(JSON.stringify({ ...stored({}), settings: "oops" })).recovered).toBe(true);
  });

  it("repairs missing or wrongly typed muted, volumes and ambience instead of discarding the save", () => {
    const { r, state } = loadState({ ...stored({}), settings: { ...stored({}).settings, volumes: 5, muted: "x", ambienceMix: undefined } });
    expect(r.recovered).toBe(false);
    expect(state.muted).toBe(false);
    expect(state.volumes).toEqual({ music: 0.5, ambience: 0.35, ui: 0.7 });
    expect(state.name).toBe("Ren");
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
    const id = r.persisted.clientId;
    expect(state.events).toEqual([{ ...good, id: `${id}:1` }, { kind: "mission_first_set", id: `${id}:2` }]); // saves from before ids get theirs on load (D-24)
  });

  it("gives events already carrying ids no new ones, and numbers new ones after the highest this device used", () => {
    const id = fresh().clientId;
    const stored = { ...fresh(), events: [{ kind: "mission_first_set", id: `${id}:7` }, { kind: "dev_grant", knowledge: 1, id: "other-device:3" }, good] };
    const state = stateFromPersisted(load(JSON.stringify(stored)).persisted, NOW, { recovered: false, storageBlocked: false });
    expect(state.events.map((e) => e.id)).toEqual([`${id}:7`, "other-device:3", `${id}:8`]);
  });

  it("refuses an event whose id is not a short string", () => {
    expect(isEvent({ kind: "mission_first_set", id: 5 })).toBe(false);
    expect(isEvent({ kind: "mission_first_set", id: "x".repeat(101) })).toBe(false);
    expect(isEvent({ kind: "mission_first_set", id: "a:1" })).toBe(true);
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

describe("the calendar survives storage", () => {
  const day = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime();
  const load2 = (data: unknown) => { const r = load(JSON.stringify(data)); return { r, state: stateFromPersisted(r.persisted, NOW, { recovered: r.recovered, storageBlocked: false }) }; };

  it("round-trips the studied days through the app state", () => {
    const state: AppState = { ...initialState, studiedDays: [{ day: "2026-11-20", style: 0 }, { day: "2026-11-22", style: 1 }] };
    const back = stateFromPersisted(toPersisted(state, fresh(), ISO), NOW, { recovered: false, storageBlocked: false });
    expect(back.studiedDays).toEqual(state.studiedDays);
  });

  it("a session that ended while the tab was closed is stamped on the day it really ended, not the day the tab reopened", () => {
    const endsAt = day(2026, 10, 20, 15);
    const p = { ...fresh(), timer: { status: "running" as const, durationMs: 25 * 60_000, endsAt } };
    const state = stateFromPersisted(p, day(2026, 10, 23), { recovered: false, storageBlocked: false });
    expect(state.timer.status).toBe("complete");
    expect(state.studiedDays).toEqual([{ day: "2026-11-20", style: 0 }]);
  });

  it("drops stamps that are not real dates, repeats and non-objects, and fixes an unknown design, keeping the rest", () => {
    const { r, state } = load2({ ...fresh(), studiedDays: [
      { day: "2026-11-20", style: 0 }, { day: "2026-02-31", style: 0 }, { day: "yesterday", style: 0 }, null, 7, "2026-11-21",
      { day: "2026-11-20", style: 1 }, { day: "2026-11-22", style: 99 }, { day: "2026-11-23" },
    ] });
    expect(r.recovered).toBe(false);
    expect(state.studiedDays).toEqual([{ day: "2026-11-20", style: 0 }, { day: "2026-11-22", style: 0 }, { day: "2026-11-23", style: 0 }]);
  });

  it("a missing or broken list becomes an empty calendar, and the save is kept", () => {
    for (const studiedDays of [undefined, null, "x", 5, {}]) {
      const { r, state } = load2({ ...fresh(), name: "Ren", studiedDays });
      expect(r.recovered, JSON.stringify(studiedDays)).toBe(false);
      expect(state.studiedDays).toEqual([]);
      expect(state.name).toBe("Ren");
    }
  });

  it("an absurdly long list is trimmed to the newest days; the save is kept", () => {
    const days = Array.from({ length: 4000 }, (_, i) => ({ day: new Date(2000, 0, 1 + i).toISOString().slice(0, 10), style: 0 })).reverse(); // newest first, to prove order does not matter
    const { r, state } = load2({ ...fresh(), name: "Ren", studiedDays: days });
    expect(r.recovered).toBe(false);
    expect(state.name).toBe("Ren");
    expect(state.studiedDays).toHaveLength(3660);
    expect(state.studiedDays.at(-1)!.day).toBe(days[0]!.day); // the newest day is kept
    expect(state.studiedDays[0]!.day < state.studiedDays.at(-1)!.day).toBe(true); // and the list is in date order
  });
});

describe("a session that ended while the tab was closed is announced when the player comes back", () => {
  const MAP = "Morgana: There's a map now. Don't wander off.";
  const reopen = (patch: object) => {
    const r = load(JSON.stringify({ ...fresh(), ...patch }));
    return stateFromPersisted(r.persisted, NOW, { recovered: r.recovered, storageBlocked: false });
  };

  it("brings the Knowledge, the level, each gift and the unlock the session earned, in order", () => {
    const state = reopen({ timer: { status: "running", durationMs: 120 * 60_000, endsAt: NOW - 60_000 } }); // 125 Knowledge: level 4
    expect(state.banners.map((b) => b.text)).toEqual(["+125 Knowledge", "Level 4", MAP, "A new stamp for your calendar: star.", "You unlocked a new location. Someone's waiting for you."]);
    expect(state.timer.status).toBe("complete");
  });

  it("says nothing when no session ended while the tab was closed, or when it did not change the level", () => {
    expect(reopen({}).banners).toEqual([]);
    expect(reopen({ timer: { status: "idle", durationMs: 25 * 60_000 } }).banners).toEqual([]);
    const small = reopen({ events: [{ kind: "mission_first_set" }], timer: { status: "running", durationMs: 25 * 60_000, endsAt: NOW - 60_000 } }); // 10 → 40: level 2 → 3
    expect(small.banners.map((b) => b.text)).toEqual(["+30 Knowledge", "Level 3", "You unlocked a new location. Someone's waiting for you."]);
  });

  it("does not repeat what the player already heard: a second visit with the session already recorded is quiet", () => {
    const first = reopen({ timer: { status: "running", durationMs: 25 * 60_000, endsAt: NOW - 60_000 } });
    const stored = toPersisted(first, fresh(), ISO);
    expect(reopen(stored).banners).toEqual([]);
  });

  it("Sojiro's greeting comes first when the player enters, then the news from the session that ended while they were away", () => {
    const state = reopen({ timer: { status: "running", durationMs: 25 * 60_000, endsAt: NOW - 60_000 } });
    const entered = reducer({ ...state, entered: false, layer: "splash" }, { type: "ENTER" });
    expect(entered.banners.map((b) => b.text)[0]).toBe("Ah, you're back.");
    expect(entered.banners.map((b) => b.text)).toContain("+30 Knowledge");
    expect(entered.banners.length).toBeGreaterThan(1);
  });
});

describe("the story survives storage", () => {
  const msg = (text: string, side: "them" | "me" = "them") => ({ side, from: "morgana", text });
  const reopen = (patch: object) => {
    const r = load(JSON.stringify({ ...fresh(), ...patch }));
    return { r, state: stateFromPersisted(r.persisted, NOW, { recovered: r.recovered, storageBlocked: false, firstVisit: false }) };
  };

  it("round-trips thread progress through the app state", () => {
    const story = { morgana: { cursor: 3, messages: [msg("Oi."), msg("Name?"), msg("Ren", "me")], done: false } };
    const back = stateFromPersisted(toPersisted({ ...initialState, story }, fresh(), ISO), NOW, { recovered: false, storageBlocked: false });
    expect(back.story).toEqual(story);
  });

  it("onboarding runs once: after a reload the saved progress is there, and it does not start again", () => {
    const entered = [{ type: "ENTER" as const }].reduce(reducer, { ...initialState, layer: "splash" as const, firstVisit: true });
    const saved = toPersisted(entered, fresh(), ISO);
    const { state } = reopen(saved); // the next visit
    expect(state.story["morgana"]!.messages).toHaveLength(3);
    const again = reducer({ ...state, entered: false, layer: "splash" }, { type: "ENTER" });
    expect(again.story["morgana"]!.messages).toHaveLength(3); // not three more
    expect(again.phoneOpen).toBe(false); // and the phone does not pop open on a return
  });

  it("an existing player (a schema-4 save) is not onboarded, and each character they have unlocked sends their first message", () => {
    const v4 = { ...fresh(), schema: 4, story: undefined, events: [{ kind: "mission_first_set" }, { kind: "dev_grant", knowledge: 40 }], visited: ["leblanc", "ryuji"], studiedDays: [] };
    const { state } = reopen(v4);
    expect(state.story).toEqual({});
    const entered = reducer({ ...state, entered: false, layer: "splash" }, { type: "ENTER" });
    expect(entered.story["morgana"]).toBeUndefined();
    expect(entered.story["ryuji"]!.done).toBe(true); // they have already been to the roof: invitation and arrival play out
    expect(entered.unreadThreads).toContain("ryuji");
  });

  it("a save with a missing or broken story loads with an empty one; the rest is kept", () => {
    for (const story of [undefined, null, "x", 5, [], 7]) {
      const { r, state } = reopen({ name: "Ren", story });
      expect(r.recovered, JSON.stringify(story)).toBe(false);
      expect(state.story).toEqual({});
      expect(state.name).toBe("Ren");
    }
  });
});

describe("repairStory", () => {
  const good = { cursor: 2, messages: [{ side: "them", from: "morgana", text: "Oi." }], done: false };

  it("keeps a well-formed thread, and at the last step it is finished", () => {
    expect(repairStory({ morgana: good }).morgana).toEqual({ cursor: 2, messages: good.messages, done: false });
    const steps = THREADS.find((t) => t.id === "ryuji")!.steps.length;
    expect(repairStory({ ryuji: { ...good, cursor: steps, done: false } }).ryuji!.done).toBe(true); // at the last step: finished, whatever the file says
    expect(repairStory({ ryuji: { ...good, cursor: steps - 1, done: false } }).ryuji!.done).toBe(false); // one step short: still going
  });

  it("a thread the player finished stays finished when its content changes in a later build", () => {
    const steps = THREADS.find((t) => t.id === "ryuji")!.steps.length;
    // Saved when the thread was shorter (done, cursor at the old end): now it has more steps. It must not reopen or replay.
    const grown = repairStory({ ryuji: { cursor: steps - 2, messages: good.messages, done: true } }).ryuji!;
    expect(grown.done).toBe(true);
    expect(grown.cursor).toBe(steps);
    // Saved when the thread was longer: a position past the end is the end, not a corrupt save.
    const shrunk = repairStory({ ryuji: { ...good, cursor: steps + 5, done: false } }).ryuji!;
    expect(shrunk.done).toBe(true);
    expect(shrunk.cursor).toBe(steps);
  });

  it("a finished thread does not say its new lines to a player who has already finished it", () => {
    const steps = THREADS.find((t) => t.id === "ryuji")!.steps.length;
    const r = load(JSON.stringify({ ...fresh(), story: { ryuji: { cursor: steps - 2, messages: [{ side: "them", from: "ryuji", text: "Yo!" }], done: true } }, events: [{ kind: "dev_grant", knowledge: 40 }], visited: ["leblanc", "ryuji"] }));
    const state = stateFromPersisted(r.persisted, NOW, { recovered: false, storageBlocked: false, firstVisit: false });
    const entered = reducer({ ...state, entered: false, layer: "splash" }, { type: "ENTER" });
    expect(entered.story["ryuji"]!.messages).toHaveLength(1); // nothing replayed
    expect(entered.unreadThreads).not.toContain("ryuji");
  });

  it("drops threads that are not real, and ones whose position is impossible", () => {
    const out = repairStory({ nonsense: good, morgana: { ...good, cursor: -1 }, ann: { ...good, cursor: 1.5 }, haru: "x", futaba: null });
    expect(out).toEqual({});
  });

  it("drops bad messages and cuts long ones, keeping the rest", () => {
    const out = repairStory({ morgana: { cursor: 2, done: false, messages: [
      good.messages[0], { side: "them", text: "" }, { side: "elsewhere", text: "x" }, null, "x", { side: "me", text: "y".repeat(900) }, { side: "them", from: 7, text: "no sender" },
      { side: "them", text: "paced", delayMs: 99999 },
    ] } });
    const texts = out.morgana!.messages.map((m) => m.text.length);
    expect(texts).toEqual([3, 500, 9, 5]);
    expect(out.morgana!.messages[2]!.from).toBe("morgana"); // a missing sender falls back to the thread's
    expect(out.morgana!.messages[3]!.delayMs).toBe(5000); // capped
  });

  it("a feedback thread is never done, however far it has got", () => {
    expect(repairStory({ feedback: { ...good, cursor: 2 } }).feedback!.done).toBe(false);
  });

  it("never keeps more than the cap", () => {
    const many = Array.from({ length: 400 }, (_, i) => ({ side: "them", from: "morgana", text: `m${i}` }));
    const out = repairStory({ morgana: { cursor: 2, messages: many, done: false } });
    expect(out.morgana!.messages).toHaveLength(200);
    expect(out.morgana!.messages.at(-1)!.text).toBe("m399"); // the newest are kept
  });
});
