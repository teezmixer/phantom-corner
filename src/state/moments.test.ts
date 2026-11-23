import { describe, expect, it } from "vitest";
import { sfxFor } from "@/audio/triggers";
import { ui } from "@/content/copy";
import { bannersFor } from "./banners";
import { BREAK_MS, BREAK_OPTIONS_MIN, initialState, reducer, syncGroups, type AppState } from "./store";

const room: AppState = { ...initialState, layer: "main", entered: true, firstVisit: false, mission: "Read" };
const done = (s: AppState) => reducer(s, { type: "TOGGLE_MISSION_DONE" });

describe("the mission-complete moment", () => {
  it("ticking the mission done brings a banner and a sound; un-ticking brings neither", () => {
    const ticked = done(room);
    expect(ticked.missionDone).toBe(true);
    expect(ticked.banners.map((b) => b.text)).toContain(ui.banner.missionDone);
    expect(sfxFor(room, ticked)).toContain("missionDone");
    const unticked = done(ticked);
    expect(unticked.banners).toEqual(ticked.banners);
    expect(sfxFor(ticked, unticked)).not.toContain("missionDone");
  });
  it("each time it is ticked is its own banner, and editing the mission text is not a completion", () => {
    const again = done(done(done(room)));
    expect(new Set(again.banners.filter((b) => b.text === ui.banner.missionDone).map((b) => b.id)).size).toBe(2);
    expect(bannersFor({ ...room, missionDone: false }, { ...room, missionDone: true, mission: "Different" }).map((b) => b.text)).not.toContain(ui.banner.missionDone);
  });
  it("a mission that arrives already done (a sync from another device, or a load) makes no sound and no banner", () => {
    const synced = reducer(room, { type: "SYNC_APPLY", patch: { events: [], settings: { muted: false, volumes: room.volumes, ambienceMix: {}, hiddenWidgets: [], hudSize: 1, motion: "system", todoCollapsed: false, menuStyle: "text" }, mission: { mission: "Read", missionDone: true, missionDeadline: null }, todos: { todos: [], nextTodoId: 1 }, stamps: { settings: "", mission: "", todos: "" } }, basis: syncGroups(room) });
    expect(synced.missionDone).toBe(true);
    expect(sfxFor(room, synced)).not.toContain("missionDone");
    expect(synced.banners.map((b) => b.text)).not.toContain(ui.banner.missionDone);
    expect(sfxFor(room, { ...room, missionDone: true })).not.toContain("missionDone"); // as a load would
  });
  it("is quieter than the session fanfare: its notes are fewer and softer", async () => {
    const { SFX } = await import("@/audio/sfx");
    expect(Math.max(...SFX.missionDone.map((n) => n.gain))).toBeLessThan(Math.max(...SFX.sessionComplete.map((n) => n.gain)));
  });
});

describe("the break in depth", () => {
  const onBreak = reducer({ ...room, layer: "choice" }, { type: "START_BREAK", now: 1000 });

  it("starts at five minutes and can be set to any offered length, restarting from now", () => {
    expect(onBreak.breakEndsAt).toBe(1000 + BREAK_MS);
    expect(onBreak.breakMinutes).toBe(5);
    for (const m of BREAK_OPTIONS_MIN) {
      const s = reducer(onBreak, { type: "SET_BREAK", now: 5000, minutes: m });
      expect(s.breakEndsAt).toBe(5000 + m * 60_000);
      expect(s.breakMinutes).toBe(m);
    }
  });
  it("refuses a length that is not offered, and a length change outside a break", () => {
    expect(reducer(onBreak, { type: "SET_BREAK", now: 5000, minutes: 3 }).breakEndsAt).toBe(onBreak.breakEndsAt);
    expect(reducer(room, { type: "SET_BREAK", now: 5000, minutes: 10 }).breakEndsAt).toBe(room.breakEndsAt);
  });
  it("running out plays the cue and shows the banner; skipping the rest does neither", () => {
    const ended = reducer(onBreak, { type: "END_BREAK" });
    expect(ended.layer).toBe("choice");
    expect(ended.banners.map((b) => b.text)).toContain(ui.banner.breakOver);
    expect(sfxFor(onBreak, ended)).toContain("breakEnd");
    const skipped = reducer(onBreak, { type: "SKIP_BREAK" });
    expect(skipped.layer).toBe("choice");
    expect(skipped.banners.map((b) => b.text)).not.toContain(ui.banner.breakOver);
    expect(sfxFor(onBreak, skipped)).not.toContain("breakEnd");
  });
  it("a late tick after skipping cannot play the cue", () => {
    const skipped = reducer(onBreak, { type: "SKIP_BREAK" });
    expect(reducer(skipped, { type: "END_BREAK" }).lastBreak).toBe("skipped");
  });
});
