import { describe, expect, it } from "vitest";
import { initialTimer } from "@/domain/timer";
import { MAX_USER_TRACKS } from "@/domain/youtube";
import { isPersisted } from "./persistence/guard";
import { repairUserTracks, stateFromPersisted, toPersisted } from "./persistence/mapping";
import { freshPersisted } from "./persistence/schema";
import { initialState, reducer, type AppState } from "./store";

const id = (n: number) => `video${String(n).padStart(6, "0")}`; // eleven characters
const room: AppState = { ...initialState, entered: true, layer: "main" };

describe("the player's own TV links in the state", () => {
  it("adds a link once, ignores anything that is not a video id, and removes one", () => {
    let s = reducer(room, { type: "ADD_USER_TRACK", id: id(1) });
    s = reducer(s, { type: "ADD_USER_TRACK", id: id(1) });
    s = reducer(s, { type: "ADD_USER_TRACK", id: "not an id" });
    expect(s.userTracks).toEqual([id(1)]);
    expect(reducer(s, { type: "REMOVE_USER_TRACK", id: id(1) }).userTracks).toEqual([]);
    expect(reducer(s, { type: "REMOVE_USER_TRACK", id: id(9) }).userTracks).toEqual([id(1)]);
  });
  it("keeps the newest links when there are more than the limit", () => {
    let s = room;
    for (let i = 1; i <= MAX_USER_TRACKS + 3; i++) s = reducer(s, { type: "ADD_USER_TRACK", id: id(i) });
    expect(s.userTracks).toHaveLength(MAX_USER_TRACKS);
    expect(s.userTracks[0]).toBe(id(4));
    expect(s.userTracks.at(-1)).toBe(id(MAX_USER_TRACKS + 3));
  });
  it("survives a reset (it is the player's own list), and is never synced", () => {
    const s = reducer({ ...room, userTracks: [id(1)] }, { type: "RESET" });
    expect(s.userTracks).toEqual([id(1)]);
  });
});

describe("the links in storage", () => {
  const base = freshPersisted("c1", "2026-11-20T10:00:00.000Z", { timer: initialTimer, locationId: "leblanc", visited: ["leblanc"] });
  it("are saved and come back", () => {
    const state = stateFromPersisted({ ...base, userTracks: [id(1), id(2)] }, 0, { recovered: false, storageBlocked: false });
    expect(state.userTracks).toEqual([id(1), id(2)]);
    expect(toPersisted(state, base, "2026-11-21T10:00:00.000Z").userTracks).toEqual([id(1), id(2)]);
  });
  it("an older save without the field loads with none, and the save is not refused", () => {
    expect(stateFromPersisted(base, 0, { recovered: false, storageBlocked: false }).userTracks).toEqual([]);
    expect(isPersisted({ ...base })).toBe(true);
  });
  it("repair drops anything that is not a video id, repeats and the oldest over the limit; a non-array is nothing", () => {
    expect(repairUserTracks([id(1), "<script>", 5, id(1), id(2)])).toEqual([id(1), id(2)]);
    expect(repairUserTracks(Array.from({ length: 40 }, (_, i) => id(i)))).toHaveLength(MAX_USER_TRACKS);
    expect(repairUserTracks("x")).toEqual([]);
  });
  it("a list that is not strings refuses the save, like any other shape error", () => {
    expect(isPersisted({ ...base, userTracks: [1, 2] })).toBe(false);
    expect(isPersisted({ ...base, userTracks: "x" })).toBe(false);
  });
});
