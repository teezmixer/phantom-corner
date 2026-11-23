import { describe, expect, it } from "vitest";
import type { ProgressEvent } from "@/domain/progress";
import { initialState, reducer } from "@/state/store";
import { freshPersisted } from "@/state/persistence/schema";
import { initialTimer } from "@/domain/timer";
import { toPersisted } from "@/state/persistence/mapping";
import type { AppState } from "@/state/store";
import { basisOf, patchFromSnapshot, snapshotFromState } from "./apply";
import { syncOnce } from "./engine";
import { FAKE_CODE, FakeBackend, FakeServer } from "./fake";
import { mergeEvents, newer, plan } from "./merge";
import { BadCode, NotSignedIn, type Snapshot } from "./types";

const ev = (id: string, knowledge = 1): ProgressEvent => ({ kind: "story_grant", key: id, knowledge, id });
const T1 = "2026-11-20T10:00:00.000Z";
const T2 = "2026-11-21T10:00:00.000Z";
const T3 = "2026-11-22T10:00:00.000Z";
const settings = (muted: boolean) => ({ muted, volumes: { music: 0.5, ambience: 0.35, ui: 0.7 }, ambienceMix: {}, hidden: [], hudSize: 1 as const, motion: "system" as const, analytics: true, todoCollapsed: false });
const snap = (events: ProgressEvent[], at = T1, over: Partial<Snapshot["docs"]> = {}): Snapshot => ({
  events,
  docs: { settings: { data: settings(false), updatedAt: at }, mission: { data: null, updatedAt: at }, todos: { data: { todos: [], nextTodoId: 1 }, updatedAt: at }, ...over },
});

describe("mergeEvents", () => {
  it("is the union by id, this device's order first", () => {
    expect(mergeEvents([ev("a:1"), ev("a:2")], [ev("b:1"), ev("a:2")]).map((e) => e.id)).toEqual(["a:1", "a:2", "b:1"]);
  });
  it("is idempotent and does not mind which side goes first (as a set)", () => {
    const a = [ev("a:1")]; const b = [ev("b:1")];
    expect(new Set(mergeEvents(mergeEvents(a, b), b).map((e) => e.id))).toEqual(new Set(mergeEvents(b, a).map((e) => e.id)));
    expect(mergeEvents(a, a)).toEqual(a);
  });
  it("counts a first mission recorded on two devices once in the Knowledge fold", async () => {
    const { knowledgeFor } = await import("@/domain/progress");
    const merged = mergeEvents([{ kind: "mission_first_set", id: "a:1" }], [{ kind: "mission_first_set", id: "b:1" }]);
    expect(merged).toHaveLength(2);
    expect(knowledgeFor(merged)).toBe(knowledgeFor([{ kind: "mission_first_set" }]));
  });
});

describe("newer", () => {
  it("takes the newer stamp, and this device's copy on a tie or when the server has none", () => {
    const a = { data: 1, updatedAt: T1 }; const b = { data: 2, updatedAt: T2 };
    expect(newer(a, b)).toBe(b);
    expect(newer(b, a)).toBe(b);
    expect(newer(a, { data: 9, updatedAt: T1 })).toBe(a);
    expect(newer(a, undefined)).toBe(a);
  });
});

describe("plan", () => {
  it("pushes only the events the server lacks, and only documents where this device is newer and different", () => {
    const local = snap([ev("a:1"), ev("a:2")], T2);
    const p = plan(local, [ev("a:1")], { settings: { data: settings(true), updatedAt: T1 } });
    expect(p.pushEvents.map((e) => e.id)).toEqual(["a:2"]);
    expect(Object.keys(p.pushDocs).sort()).toEqual(["mission", "settings", "todos"]); // all newer here (the server has no mission or todos)
    expect(p.changedLocal).toBe(false);
  });
  it("takes a newer document from the server and says this device changed", () => {
    const p = plan(snap([], T1), [], { settings: { data: settings(true), updatedAt: T3 } });
    expect(p.merged.docs.settings.data.muted).toBe(true);
    expect(p.pushDocs.settings).toBeUndefined();
    expect(p.changedLocal).toBe(true);
  });
  it("does not push a document the server already holds with the same data (no re-stamping ping-pong)", () => {
    const local = snap([], T3);
    const p = plan(local, [], { settings: { data: settings(false), updatedAt: T1 }, mission: local.docs.mission, todos: local.docs.todos });
    expect(p.pushDocs).toEqual({});
  });
});

describe("the fake backend", () => {
  const signedIn = async (server: FakeServer, email = "a@b.co") => { const b = new FakeBackend(server); await b.requestCode(email); await b.verifyCode(email, FAKE_CODE); return b; };

  it("rejects a wrong code and a bad address, and everything while signed out", async () => {
    const b = new FakeBackend(new FakeServer());
    await expect(b.requestCode("nope")).rejects.toThrow();
    await expect(b.verifyCode("a@b.co", "000000")).rejects.toBeInstanceOf(BadCode);
    await expect(b.pullEvents()).rejects.toBeInstanceOf(NotSignedIn);
  });
  it("guest to account: the first sign-in uploads the whole local log once", async () => {
    const server = new FakeServer();
    const b = await signedIn(server);
    const local = snap([ev("g:1"), ev("g:2")]);
    await syncOnce(b, local);
    expect((await b.pullEvents()).map((e) => e.id)).toEqual(["g:1", "g:2"]);
    await syncOnce(b, local); // again: nothing is duplicated
    expect(await b.pullEvents()).toHaveLength(2);
  });
  it("a second device with its own history ends up with both, and so does the first on its next sync", async () => {
    const server = new FakeServer();
    const first = await signedIn(server); const second = await signedIn(server);
    await syncOnce(first, snap([ev("a:1")]));
    const { merged } = await syncOnce(second, snap([ev("b:1")]));
    expect(merged.events.map((e) => e.id).sort()).toEqual(["a:1", "b:1"]);
    const back = await syncOnce(first, snap([ev("a:1")]));
    expect(back.merged.events.map((e) => e.id).sort()).toEqual(["a:1", "b:1"]);
  });
  it("one account cannot see another's rows", async () => {
    const server = new FakeServer();
    const alice = await signedIn(server, "alice@x.co"); const bob = await signedIn(server, "bob@x.co");
    await alice.pushEvents([ev("a:1")]);
    expect(await bob.pullEvents()).toEqual([]);
  });
  it("is append-only: pushing an id again does not change the stored event", async () => {
    const b = await signedIn(new FakeServer());
    await b.pushEvents([ev("a:1", 1)]);
    await b.pushEvents([ev("a:1", 999)]);
    expect(await b.pullEvents()).toEqual([ev("a:1", 1)]);
  });
  it("never sends developer grants, and the server refuses them if they arrive", async () => {
    const b = await signedIn(new FakeServer());
    const dev: ProgressEvent = { kind: "dev_grant", knowledge: 50, id: "c:1" };
    expect(plan(snap([dev, ev("c:2")]), [], {}).pushEvents.map((e) => e.id)).toEqual(["c:2"]);
    await expect(b.pushEvents([dev])).rejects.toThrow();
  });
  it("refuses an event with an impossible shape", async () => {
    const b = await signedIn(new FakeServer());
    await expect(b.pushEvents([{ kind: "session", plannedMs: 1000, focusedMs: 99_999_999, outcome: "completed", id: "a:1" }])).rejects.toThrow();
  });
  it("a failed pull writes nothing (the server being down never loses progress)", async () => {
    const server = new FakeServer();
    const b = await signedIn(server);
    server.down = true;
    await expect(syncOnce(b, snap([ev("a:1")]))).rejects.toThrow("offline");
    server.down = false;
    expect(await b.pullEvents()).toEqual([]);
  });
  it("sign out keeps the server's copy and needs a new sign-in; delete removes everything", async () => {
    const server = new FakeServer();
    const b = await signedIn(server);
    await b.pushEvents([ev("a:1")]);
    await b.signOut();
    await expect(b.pullEvents()).rejects.toBeInstanceOf(NotSignedIn);
    const again = await signedIn(server);
    expect(await again.pullEvents()).toHaveLength(1);
    await again.deleteAccount();
    const fresh = await signedIn(server);
    expect(await fresh.pullEvents()).toEqual([]);
    expect(((await fresh.exportAll()) as { email: string }).email).toBe("a@b.co");
  });
});

describe("applying a sync to the state", () => {
  const base = freshPersisted("c1", T1, { timer: initialTimer, locationId: "leblanc", visited: ["leblanc"] });
  const room = { ...initialState, entered: true, layer: "main" as const, clientId: "c1" };
  const apply = (s: AppState, merged: Snapshot, basis = basisOf(s)) => reducer(s, { type: "SYNC_APPLY", patch: patchFromSnapshot(merged), basis });

  it("round-trips: the state's own snapshot, applied, changes nothing", () => {
    const s = reducer(room, { type: "SET_MISSION", text: "Read" });
    const next = apply(s, snapshotFromState(s, base, T2));
    expect(next.events).toEqual(s.events);
    expect(next.mission).toBe("Read");
  });

  it("takes the server's newer mission and events, but never touches the timer, the place or the story", () => {
    const s = reducer(room, { type: "SET_MISSION", text: "Old" });
    const remote = snap([...s.events, ev("b:1", 7)], T3, { mission: { data: { text: "From the other device", setAt: T3, done: true }, updatedAt: T3 } });
    const next = apply(s, plan(snapshotFromState(s, base, T2), remote.events, remote.docs).merged);
    expect(next.mission).toBe("From the other device");
    expect(next.missionDone).toBe(true);
    expect(next.events.map((e) => e.id)).toContain("b:1");
    expect(next.timer).toBe(s.timer);
    expect(next.locationId).toBe(s.locationId);
    expect(next.story).toBe(s.story);
    expect(next.banners).toEqual(s.banners); // history, not news
  });

  it("loses nothing the player did while the sync was on its way (review of M11)", () => {
    const began = reducer(room, { type: "SET_MISSION", text: "Read" });
    const basis = basisOf(began);
    const merged = plan(snapshotFromState(began, base, T2), [ev("b:1")], {}).merged; // what the round trip came back with
    // …meanwhile the player finished a session, changed the mission and added a todo:
    let now = reducer(began, { type: "DEV_GRANT", knowledge: 3 });
    now = reducer(now, { type: "SET_MISSION", text: "Changed meanwhile" });
    const next = reducer(now, { type: "SYNC_APPLY", patch: patchFromSnapshot(merged), basis });
    expect(next.events.map((e) => e.id)).toEqual(["c1:1", "c1:2", "b:1"]); // the new event is kept, the remote one added
    expect(next.mission).toBe("Changed meanwhile"); // not overwritten by the older copy; it goes up on the next sync
  });

  it("keeps the time a document had where it came from, so a stale copy cannot later pass as new (review of M11)", () => {
    const s = reducer(room, { type: "SET_MISSION", text: "Mine" });
    const remote = snap(s.events, T1, { mission: { data: { text: "Theirs", setAt: T1, done: false }, updatedAt: T3 } });
    const next = apply(s, plan(snapshotFromState(s, base, T2), remote.events, remote.docs).merged);
    expect(next.mission).toBe("Theirs");
    expect(toPersisted(next, base, "2026-11-30T00:00:00.000Z").stamps.mission).toBe(T3); // not re-dated to "now"
    const edited = reducer(next, { type: "SET_MISSION", text: "Edited here after" });
    expect(toPersisted(edited, base, "2026-11-30T00:00:00.000Z").stamps.mission).toBe("2026-11-30T00:00:00.000Z"); // a real local edit is dated now
  });

  it("never carries the analytics choice: another device cannot switch it on or off", () => {
    const s = { ...room, analytics: false };
    const remote = snap([], T3, { settings: { data: { ...settings(true) }, updatedAt: T3 } });
    expect(JSON.stringify(snapshotFromState(s, base, T2).docs.settings.data)).not.toContain("analytics");
    expect(apply(s, plan(snapshotFromState(s, base, T2), [], remote.docs).merged).analytics).toBe(false);
  });

  it("drops a bad event and clamps a bad document from the server", () => {
    const bad = [{ kind: "session", plannedMs: 5, focusedMs: 1e12, outcome: "completed", id: "x:1" }, ev("x:2")] as ProgressEvent[];
    const hostile = snap(bad, T3, { mission: { data: { text: "y".repeat(500), setAt: T3, done: false }, updatedAt: T3 } });
    const next = apply(room, hostile);
    expect(next.events.map((e) => e.id)).toEqual(["x:2"]);
    expect(next.mission.length).toBeLessThanOrEqual(80);
  });
});

describe("one refused event does not keep the rest from going up (review of M11)", () => {
  it("falls back to one by one and leaves only the refused one behind", async () => {
    const server = new FakeServer();
    const b = new FakeBackend(server);
    await b.requestCode("a@b.co"); await b.verifyCode("a@b.co", FAKE_CODE);
    const bad = { kind: "session", plannedMs: 1000, focusedMs: 99_999_999, outcome: "completed", id: "c:2" } as ProgressEvent;
    await syncOnce(b, snap([ev("c:1"), bad, ev("c:3")]));
    expect((await b.pullEvents()).map((e) => e.id)).toEqual(["c:1", "c:3"]);
  });
});
