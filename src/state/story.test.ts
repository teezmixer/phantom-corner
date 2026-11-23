import { describe, expect, it } from "vitest";
import { getLocation } from "@/content/registry";
import { WHATS_NEW_ID } from "@/content/threads";
import { derive, factsFor, initialState, reducer, type Action, type AppState } from "./store";

const MIN = 60_000;
const T0 = 1_000_000;
const splash: AppState = { ...initialState, layer: "splash", entered: false, firstVisit: true };
const run = (actions: Action[], from: AppState = splash) => actions.reduce(reducer, from);
const said = (s: AppState, id: string) => (s.story[id]?.messages ?? []).map((m) => m.text);

describe("onboarding (spec §3.5)", () => {
  const entered = run([{ type: "ENTER" }]);

  it("starts on a first visit: Sojiro's arrival line, Morgana's greeting, then her question; the phone opens on it", () => {
    expect(said(entered, "morgana")).toEqual(["Door's open. Sit wherever.", "Oi. You made it. I'm Morgana, and I'll be doing the talking.", "First things first. What do I call you?"]);
    expect(entered.story["morgana"]!.messages[0]!.from).toBe("sojiro");
    expect(entered.phoneOpen).toBe(true);
    expect(entered.phoneThread).toBe("morgana");
    expect(entered.unreadThreads).not.toContain("morgana"); // it is open in front of the player
  });

  it("does not start on a return visit, and does not start before the player has entered", () => {
    expect(run([{ type: "SET_LAYER", layer: "about" }]).story["morgana"]).toBeUndefined(); // still on the splash
    const returning = run([{ type: "ENTER" }], { ...splash, firstVisit: false });
    expect(returning.story["morgana"]).toBeUndefined();
    expect(returning.phoneOpen).toBe(false);
  });

  it("takes the player's name from their answer, uses it, and asks Ares's mission question word for word", () => {
    const s = run([{ type: "ANSWER_THREAD", id: "morgana", text: "  Ren " }], entered);
    expect(s.name).toBe("Ren");
    expect(said(s, "morgana").slice(-3)).toEqual(["Ren", "Ren. Fine. It suits you.", "What's today's mission?"]);
    expect(s.story["morgana"]!.messages.at(-3)).toMatchObject({ side: "me", text: "Ren" });
  });

  it("an answer to the wrong thread, or an empty answer, changes nothing", () => {
    expect(run([{ type: "ANSWER_THREAD", id: "ryuji", text: "x" }], entered)).toBe(entered);
    expect(run([{ type: "ANSWER_THREAD", id: "morgana", text: "   " }], entered).name).toBe("");
    const named = run([{ type: "ANSWER_THREAD", id: "morgana", text: "Ren" }], entered);
    expect(run([{ type: "ANSWER_THREAD", id: "morgana", text: "Other" }], named).name).toBe("Ren"); // not asking any more
  });

  it("writing the first mission moves it on: first Knowledge, level 2, the map (the thread says so too)", () => {
    const named = run([{ type: "ANSWER_THREAD", id: "morgana", text: "Ren" }], entered);
    const s = run([{ type: "SET_MISSION", text: "Read chapter 3" }], named);
    expect(said(s, "morgana").slice(-2)).toEqual(["A mission, written down. That's already worth something. There — Knowledge. And look, a map.", "Now start the timer. I'll stay out of your way."]);
    expect(derive(s).knowledge).toBe(10);
    expect(derive(s).mapOpen).toBe(true);
    expect(s.story["morgana"]!.done).toBe(false); // waiting for a session
  });

  it("a finished session ends onboarding, and Ryuji's message arrives right after, unread, with no progress bar anywhere", () => {
    let s = run([{ type: "ANSWER_THREAD", id: "morgana", text: "Ren" }, { type: "SET_MISSION", text: "Read" }], entered);
    s = run([{ type: "START_SESSION", now: T0 }, { type: "TIMER", event: { type: "TICK", now: T0 + 25 * MIN }, now: T0 + 25 * MIN }], s);
    expect(said(s, "morgana").at(-1)).toBe("Not bad at all. Keep that up and people will start to notice.");
    expect(s.story["morgana"]!.done).toBe(true);
    expect(said(s, "ryuji")).toEqual(["Yo! Found a spot.", "Come up to the roof when you're ready. Bring notes. Snacks too, if you're a good person."]);
    expect(s.unreadThreads).toContain("ryuji");
  });

  it("a short first session still ends onboarding without promising a message that does not come", () => {
    let s = run([{ type: "ANSWER_THREAD", id: "morgana", text: "Ren" }, { type: "SET_MISSION", text: "Read" }], entered);
    s = { ...s, timer: { status: "idle", durationMs: 10 * MIN } }; // the player chose a 10-minute session
    s = run([{ type: "START_SESSION", now: T0 }, { type: "TIMER", event: { type: "TICK", now: T0 + 10 * MIN }, now: T0 + 10 * MIN }], s);
    expect(derive(s).knowledge).toBe(25); // 10 for the mission, 10 minutes, 5 for finishing: not enough for Ryuji (35)
    expect(s.story["morgana"]!.done).toBe(true);
    expect(s.story["ryuji"]).toBeUndefined(); // nobody has written yet
    expect(said(s, "morgana").at(-1)).not.toMatch(/waiting|check your phone|message/i); // so Morgana does not say somebody has
  });

  it("skipping ends it at once and still gives the first Knowledge, so level 2 and the map are there", () => {
    const s = run([{ type: "SKIP_ONBOARDING" }], entered);
    expect(s.story["morgana"]!.done).toBe(true);
    expect(derive(s).level).toBe(2);
    expect(derive(s).mapOpen).toBe(true);
    expect(said(s, "morgana")).toHaveLength(3); // what was said stays; nothing more is asked
  });

  it("skipping twice, or after writing the first mission, never gives the Knowledge twice", () => {
    expect(derive(run([{ type: "SKIP_ONBOARDING" }, { type: "SKIP_ONBOARDING" }], entered)).knowledge).toBe(10);
    const wrote = run([{ type: "ANSWER_THREAD", id: "morgana", text: "Ren" }, { type: "SET_MISSION", text: "Read" }, { type: "SKIP_ONBOARDING" }], entered);
    expect(derive(wrote).knowledge).toBe(10);
    // And writing a mission after skipping does not grant it again either.
    expect(derive(run([{ type: "SKIP_ONBOARDING" }, { type: "SET_MISSION", text: "Read" }], entered)).knowledge).toBe(10);
  });

  it("dev: replaying onboarding runs it again from the start", () => {
    const done = run([{ type: "SKIP_ONBOARDING" }], entered);
    const again = run([{ type: "REPLAY_ONBOARDING" }], done);
    expect(said(again, "morgana")[1]).toBe("Oi. You made it. I'm Morgana, and I'll be doing the talking.");
    expect(again.story["morgana"]!.done).toBe(false);
    expect(again.phoneThread).toBe("morgana");
  });
});

describe("character threads", () => {
  const room: AppState = { ...initialState, layer: "main", entered: true, firstVisit: false };

  it("an unlock starts that character's thread, unread, and says nothing before it", () => {
    const before = run([{ type: "SET_PHONE", open: false }], room);
    expect(before.story["ryuji"]).toBeUndefined();
    expect(before.unreadThreads).not.toContain("ryuji");
    const s = run([{ type: "DEV_GRANT", knowledge: 40 }], before); // level 3
    expect(said(s, "ryuji")[0]).toBe("Yo! Found a spot.");
    expect(s.unreadThreads).toContain("ryuji");
    expect(s.story["ann"]).toBeUndefined(); // nothing telegraphs the next one
  });

  it("the arrival exchange plays when the player gets there, once", () => {
    let s = run([{ type: "DEV_GRANT", knowledge: 40 }], room);
    expect(said(s, "ryuji")).toHaveLength(2);
    s = run([{ type: "START_TRAVEL", to: "ryuji" }, { type: "ARRIVE" }], s);
    expect(said(s, "ryuji").slice(2)).toEqual(["Yo! Took you long enough. Pull up a chair — well, a crate.", "Man, this roof's the best spot. Don't tell anyone.", "Sit! Anywhere's fine. It's a roof!"]);
    expect(s.story["ryuji"]!.done).toBe(true);
    const count = said(s, "ryuji").length;
    s = run([{ type: "START_TRAVEL", to: "leblanc" }, { type: "ARRIVE" }, { type: "START_TRAVEL", to: "ryuji" }, { type: "ARRIVE" }], s);
    expect(said(s, "ryuji")).toHaveLength(count); // not again
  });

  it.each(["ryuji", "ann", "yusuke", "makoto", "futaba", "haru", "akechi"])("%s: arriving plays that place's arrival lines, in order, once", (id) => {
    const arrive = getLocation(id).lines.arrive;
    let s = run([{ type: "DEV_UNLOCK_ALL" }, { type: "START_TRAVEL", to: id }, { type: "ARRIVE" }], room);
    expect(said(s, id).slice(-arrive.length)).toEqual(arrive);
    expect(s.story[id]!.done).toBe(true);
    const count = said(s, id).length;
    s = run([{ type: "START_TRAVEL", to: "leblanc" }, { type: "ARRIVE" }, { type: "START_TRAVEL", to: id }, { type: "ARRIVE" }], s);
    expect(said(s, id)).toHaveLength(count);
  });

  it("dev unlock-all starts all seven character threads, unread", () => {
    const s = run([{ type: "DEV_UNLOCK_ALL" }], room);
    for (const id of ["ryuji", "ann", "yusuke", "makoto", "futaba", "haru", "akechi"]) {
      expect(s.story[id], id).toBeDefined();
      expect(s.unreadThreads, id).toContain(id);
    }
  });

  it("reading a thread clears its mark", () => {
    const s = run([{ type: "DEV_GRANT", knowledge: 40 }, { type: "READ_THREAD", id: "ryuji" }], room);
    expect(s.unreadThreads).not.toContain("ryuji");
  });
});

describe("what's new and feedback", () => {
  const returning: AppState = { ...initialState, layer: "main", entered: true, firstVisit: false };

  it("a returning player gets the release note at once, crediting the people who asked", () => {
    const s = run([{ type: "SET_PHONE", open: false }], returning);
    expect(said(s, WHATS_NEW_ID).at(-1)).toBe("Everyone who asked for this: thank you. It's yours.");
    expect(s.unreadThreads).toContain(WHATS_NEW_ID);
  });

  it("a first-time player gets it only after onboarding is finished or skipped", () => {
    const entered = run([{ type: "ENTER" }], splash);
    expect(entered.story[WHATS_NEW_ID]).toBeUndefined();
    const skipped = run([{ type: "SKIP_ONBOARDING" }], entered);
    expect(said(skipped, WHATS_NEW_ID)).toHaveLength(3);
  });

  it("a new player has no feedback thread, and no unread badge, until onboarding is over", () => {
    const entered = run([{ type: "ENTER" }], splash);
    expect(entered.story["feedback"]).toBeUndefined();
    expect(entered.unreadThreads).toEqual([]); // Morgana is open in front of them; nothing else is waiting
    const skipped = run([{ type: "SKIP_ONBOARDING" }], entered);
    expect(skipped.story["feedback"]).toBeDefined();
    // Not even on the splash, before they have come in.
    expect(run([{ type: "SET_LAYER", layer: "about" }], splash).story["feedback"]).toBeUndefined();
  });

  it("feedback is captured in the thread, on this device, and trimmed", () => {
    let s = run([{ type: "SET_PHONE", open: false }], returning);
    s = run([{ type: "POST_MESSAGE", id: "feedback", text: "  Love the map  " }, { type: "POST_MESSAGE", id: "feedback", text: "x".repeat(900) }], s);
    const mine = s.story["feedback"]!.messages.filter((m) => m.side === "me");
    expect(mine.map((m) => m.text.length)).toEqual([12, 500]);
    expect(mine[0]!.text).toBe("Love the map");
    expect(s.story["feedback"]!.done).toBe(false); // never closes
  });

  it("only a thread that allows it takes a written message", () => {
    const s = run([{ type: "SET_PHONE", open: false }], returning);
    expect(run([{ type: "POST_MESSAGE", id: WHATS_NEW_ID, text: "hi" }], s)).toBe(s);
    expect(run([{ type: "POST_MESSAGE", id: "nope", text: "hi" }], s)).toBe(s);
    expect(run([{ type: "POST_MESSAGE", id: "feedback", text: "  " }], s)).toBe(s);
  });
});

describe("facts", () => {
  it("reports what the story may look at", () => {
    const s = run([{ type: "DEV_GRANT", knowledge: 40 }, { type: "SET_MISSION", text: "x" }], { ...initialState, layer: "main", entered: true });
    expect(factsFor(s)).toMatchObject({ missionSet: true, sessionsCompleted: 0, name: "", entered: true });
    expect(factsFor(s).unlocked).toEqual(expect.arrayContaining(["leblanc", "ryuji"]));
  });
});

describe("what counts as a first visit (D-32)", () => {
  it("a reset returns to the splash as a return: no onboarding, no phone opening by itself", () => {
    const started = run([{ type: "ENTER" }], splash);
    const reset = run([{ type: "RESET" }, { type: "ENTER" }], started);
    expect(reset.story["morgana"]).toBeUndefined();
    expect(reset.phoneOpen).toBe(false);
  });

  it("with storage blocked the visit is not a first visit, so nobody is onboarded on every load", () => {
    const blocked = run([{ type: "ENTER" }], { ...splash, firstVisit: false, storageBlocked: true });
    expect(blocked.story["morgana"]).toBeUndefined();
  });
});
