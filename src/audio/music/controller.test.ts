import { describe, expect, it } from "vitest";
import type { TrackRef } from "@/content/types";
import { PLACEHOLDER_PLAYLIST } from "@/content/tracks";
import { currentTrack, initialMusic, isActive, musicReducer, nextIndex, type MusicEvent, type MusicState } from "./controller";

const track = (id: string): TrackRef => ({ videoId: id.padEnd(11, "x"), title: id, source: "rights-holder", checkedOn: "2026-11-22" });
const T = [track("a"), track("b"), track("c")];
const run = (events: MusicEvent[], from: MusicState = initialMusic(T)) => events.reduce(musicReducer, from);

describe("music state machine", () => {
  it("starts off with a playlist and unavailable without one", () => {
    expect(initialMusic(T).status).toBe("off");
    expect(initialMusic([]).status).toBe("unavailable");
    expect(musicReducer(initialMusic([]), { type: "PLAY" }).status).toBe("unavailable");
  });

  it("never starts by itself: only PLAY, NEXT or PREV leave 'off', and a stray playing event is ignored", () => {
    let s = initialMusic(T);
    expect(musicReducer(s, { type: "PLAYER_PLAYING" }).status).toBe("off");
    s = run([{ type: "PLAY" }]);
    expect(s.status).toBe("loading");
    expect(run([{ type: "PLAY" }, { type: "PLAYER_PLAYING" }]).status).toBe("playing");
  });

  it("pauses and plays again", () => {
    const s = run([{ type: "PLAY" }, { type: "PLAYER_PLAYING" }, { type: "PAUSE" }]);
    expect(s.status).toBe("paused");
    expect(musicReducer(s, { type: "PLAYER_PLAYING" }).status).toBe("paused"); // late event ignored
    expect(musicReducer(s, { type: "PLAY" }).status).toBe("loading");
  });

  it("moves to the next and previous track, wrapping around, and starts loading it", () => {
    const next = run([{ type: "NEXT" }]);
    expect([next.index, next.status]).toEqual([1, "loading"]);
    expect(run([{ type: "PREV" }]).index).toBe(2); // wraps to the end
    expect(run([{ type: "NEXT" }, { type: "NEXT" }, { type: "NEXT" }]).index).toBe(0);
  });

  it("continues to the next track when one ends, looping the playlist", () => {
    const s = run([{ type: "PLAY" }, { type: "PLAYER_PLAYING" }, { type: "PLAYER_ENDED" }]);
    expect([s.index, s.status]).toEqual([1, "loading"]);
  });

  it.each([100, 101, 150, 153, 2, 5])("error %i skips the track silently and keeps playing the next", (code) => {
    const s = run([{ type: "PLAY" }, { type: "PLAYER_ERROR", code }]);
    expect(s.failed).toEqual([0]);
    expect([s.index, s.status]).toEqual([1, "loading"]);
  });

  it("ignores errors that are not about the track", () => {
    const s = run([{ type: "PLAY" }]);
    expect(musicReducer(s, { type: "PLAYER_ERROR", code: 42 })).toBe(s);
  });

  it("skips failed tracks forever after, in both directions", () => {
    const s = run([{ type: "PLAY" }, { type: "PLAYER_ERROR", code: 150 }]); // a failed, now on b
    expect(nextIndex(s, 1, 1)).toBe(2);
    expect(nextIndex(s, 2, 1)).toBe(1); // wraps past failed 0
    expect(nextIndex(s, 1, -1)).toBe(2); // wraps backwards past failed 0
  });

  it("says unavailable when every track has failed", () => {
    const s = run([
      { type: "PLAY" },
      { type: "PLAYER_ERROR", code: 150 },
      { type: "PLAYER_ERROR", code: 101 },
      { type: "PLAYER_ERROR", code: 100 },
    ]);
    expect(s.status).toBe("unavailable");
    expect(s.failed).toEqual([0, 1, 2]);
    expect(run([{ type: "NEXT" }], s).status).toBe("unavailable");
  });

  it("an error while paused skips ahead without starting playback", () => {
    const s = run([{ type: "PLAY" }, { type: "PLAYER_PLAYING" }, { type: "PAUSE" }, { type: "PLAYER_ERROR", code: 150 }]);
    expect(s.status).toBe("paused");
  });

  it("reports blocked when a requested play does not start, and recovers when it does", () => {
    const blocked = run([{ type: "PLAY" }, { type: "PLAYER_BLOCKED" }]);
    expect(blocked.status).toBe("blocked");
    expect(musicReducer(blocked, { type: "PLAYER_PLAYING" }).status).toBe("playing");
    expect(musicReducer(initialMusic(T), { type: "PLAYER_BLOCKED" }).status).toBe("off"); // nothing was requested
  });

  it("a new playlist (travel) stops playback: music only ever starts from the user", () => {
    const playing = run([{ type: "PLAY" }, { type: "PLAYER_PLAYING" }, { type: "NEXT" }]);
    const travelled = musicReducer(playing, { type: "SET_PLAYLIST", tracks: [track("z")] });
    expect(travelled).toMatchObject({ status: "off", index: 0, failed: [] });
    expect(travelled.tracks).toHaveLength(1);
  });

  it("says unavailable when the YouTube script cannot load", () => {
    expect(musicReducer(initialMusic(T), { type: "API_FAILED" }).status).toBe("unavailable");
  });

  it("exposes the current track and whether audio is active", () => {
    expect(currentTrack(initialMusic(T))?.title).toBe("a");
    expect(currentTrack(initialMusic([]))).toBeNull();
    expect(isActive(run([{ type: "PLAY" }]))).toBe(true);
    expect(isActive(initialMusic(T))).toBe(false);
  });

  it("the shipped placeholder playlist is valid: 11-character ids, rights-holder, dated", () => {
    for (const t of PLACEHOLDER_PLAYLIST) {
      expect(t.videoId).toHaveLength(11);
      expect(t.source).toBe("rights-holder");
      expect(t.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
