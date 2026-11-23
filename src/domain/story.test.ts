import { describe, expect, it } from "vitest";
import { MAX_MESSAGES, answer, pendingAsk, post, run, skip, stepAll, triggered, waitSatisfied, type Facts, type Progress, type Thread, type ThreadProgress } from "./story";

const facts = (patch: Partial<Facts> = {}): Facts => ({ entered: true, firstVisit: false, name: "", missionSet: false, sessionsCompleted: 0, visited: ["leblanc"], unlocked: ["leblanc"], release: "0.1", defaultName: "Student Ren", ...patch });
const empty: ThreadProgress = { cursor: 0, messages: [], done: false };
const onboarding: Thread = {
  id: "morgana", title: "Morgana", from: "morgana", trigger: { on: "first_visit" },
  steps: [{ say: "Oi." }, { say: "Name?" }, { ask: "name" }, { say: "Hello, {name}." }, { waitFor: "mission_set" }, { say: "Worth something." }, { waitFor: "session_completed" }, { say: "Go to Ryuji." }],
};
const ryuji: Thread = {
  id: "ryuji", title: "Ryuji", from: "ryuji", trigger: { on: "unlock", location: "ryuji" },
  steps: [{ say: "Yo!" }, { waitFor: "arrived", location: "ryuji" }, { say: "Took you long enough." }, { say: "Sit." }],
};
const texts = (p: ThreadProgress) => p.messages.map((m) => m.text);

describe("run", () => {
  it("says lines until it must wait for an answer, and no further", () => {
    const { progress } = run(onboarding, empty, facts());
    expect(texts(progress)).toEqual(["Oi.", "Name?"]);
    expect(progress.cursor).toBe(2);
    expect(progress.done).toBe(false);
    expect(pendingAsk(onboarding, progress)).toBe("name");
  });

  it("an answer is recorded as the player's own line and the thread moves on, using the name", () => {
    const asked = run(onboarding, empty, facts()).progress;
    const answered = answer(onboarding, asked, "  Ren  ", "Ren");
    expect(answered.messages.at(-1)).toEqual({ side: "me", from: "Ren", text: "Ren" });
    const next = run(onboarding, answered, facts({ name: "Ren" })).progress;
    expect(texts(next)).toEqual(["Oi.", "Name?", "Ren", "Hello, Ren."]);
    expect(next.cursor).toBe(4); // stopped at the wait for the mission
  });

  it("says the default name when the player has none yet", () => {
    const t: Thread = { id: "x", title: "X", from: "x", steps: [{ say: "Hi {name}." }] };
    expect(texts(run(t, empty, facts()).progress)).toEqual(["Hi Student Ren."]);
  });

  it.each([
    ["the mission is not set", { missionSet: false }, false],
    ["the mission is set", { missionSet: true }, true],
  ])("a wait for the mission holds while %s", (_name, patch, passes) => {
    const at: ThreadProgress = { cursor: 4, messages: [], done: false };
    const out = run(onboarding, at, facts({ name: "Ren", ...patch })).progress;
    expect(out.cursor > 4).toBe(passes);
    expect(texts(out).includes("Worth something.")).toBe(passes);
  });

  it("waits for a completed session, then finishes", () => {
    const at: ThreadProgress = { cursor: 6, messages: [], done: false };
    expect(run(onboarding, at, facts({ sessionsCompleted: 0 })).progress.done).toBe(false);
    const out = run(onboarding, at, facts({ sessionsCompleted: 1 })).progress;
    expect(texts(out)).toEqual(["Go to Ryuji."]);
    expect(out.done).toBe(true);
  });

  it("a wait for arriving names its location: arriving somewhere else does not release it", () => {
    const at: ThreadProgress = { cursor: 1, messages: [], done: false };
    expect(run(ryuji, at, facts({ visited: ["leblanc", "ann"] })).progress.cursor).toBe(1);
    expect(run(ryuji, at, facts({ visited: ["leblanc", "ryuji"] })).progress.done).toBe(true);
  });

  it("a finished thread is left alone, and a thread with nothing to do returns the very same object", () => {
    const done: ThreadProgress = { cursor: 4, messages: [], done: true };
    expect(run(ryuji, done, facts()).progress).toBe(done);
    const waiting: ThreadProgress = { cursor: 1, messages: [{ side: "them", from: "ryuji", text: "Yo!" }], done: false };
    expect(run(ryuji, waiting, facts()).progress).toBe(waiting);
  });

  it("carries a line's own sender and pause", () => {
    const t: Thread = { id: "x", title: "X", from: "morgana", steps: [{ say: "Door's open.", from: "sojiro", delayMs: 600 }] };
    expect(run(t, empty, facts()).progress.messages[0]).toEqual({ side: "them", from: "sojiro", text: "Door's open.", delayMs: 600 });
  });

  it("a grant asks the store for Knowledge once, with a key that names the step", () => {
    const t: Thread = { id: "gift", title: "Gift", from: "morgana", steps: [{ say: "Here." }, { grant: { xp: 7 } }] };
    const first = run(t, empty, facts());
    expect(first.effects).toEqual([{ kind: "grant", xp: 7, key: "gift:1" }]);
    expect(run(t, first.progress, facts()).effects).toEqual([]); // already done
  });

  it("a grant with its own id is paid under that id, wherever the step sits", () => {
    const early: Thread = { id: "gift", title: "G", from: "m", steps: [{ grant: { xp: 7, id: "welcome" } }, { say: "Here." }] };
    const late: Thread = { id: "gift", title: "G", from: "m", steps: [{ say: "Here." }, { say: "More." }, { grant: { xp: 7, id: "welcome" } }] };
    expect(run(early, empty, facts()).effects[0]!.key).toBe("gift:welcome");
    expect(run(late, empty, facts()).effects[0]!.key).toBe("gift:welcome"); // reordered, same key: never paid twice
  });

  it("a reveal step is understood and skipped", () => {
    const t: Thread = { id: "x", title: "X", from: "x", steps: [{ reveal: "timer" }, { say: "After." }] };
    expect(texts(run(t, empty, facts()).progress)).toEqual(["After."]);
  });

  it.each(["Ren$&", "Ren$`x", "$$", "a$'b", "{name}"])("says a name exactly as typed, whatever characters it has: %s", (name) => {
    const t: Thread = { id: "x", title: "X", from: "x", steps: [{ say: "Hi {name}." }] };
    expect(texts(run(t, empty, facts({ name })).progress)).toEqual([`Hi ${name}.`]);
  });

  it("at the cap the OLDEST line goes, for both sides: new news is never swallowed", () => {
    const t: Thread = { id: "x", title: "X", from: "x", steps: [{ say: "Brand new." }] };
    const full: ThreadProgress = { cursor: 0, messages: Array.from({ length: MAX_MESSAGES }, (_, i) => ({ side: "me" as const, from: "Ren", text: `old ${i}` })), done: false };
    const out = run(t, full, facts()).progress;
    expect(out.messages).toHaveLength(MAX_MESSAGES);
    expect(out.messages.at(-1)!.text).toBe("Brand new.");
    expect(out.messages[0]!.text).toBe("old 1");
  });

  it("never holds more than the cap", () => {
    const t: Thread = { id: "x", title: "X", from: "x", steps: Array.from({ length: MAX_MESSAGES + 50 }, (_, i) => ({ say: `line ${i}` })) };
    expect(run(t, empty, facts()).progress.messages).toHaveLength(MAX_MESSAGES);
  });
});

describe("answer, post and skip", () => {
  it("an answer to nothing, or an empty answer, changes nothing", () => {
    const asked = run(onboarding, empty, facts()).progress;
    expect(answer(onboarding, asked, "   ", "Ren")).toBe(asked);
    expect(answer(onboarding, empty, "Ren", "Ren")).toBe(empty); // not asking yet
    expect(answer(ryuji, empty, "hello", "Ren")).toBe(empty);
  });

  it("an over-long answer is cut", () => {
    const asked = run(onboarding, empty, facts()).progress;
    expect(answer(onboarding, asked, "x".repeat(900), "Ren").messages.at(-1)!.text).toHaveLength(500);
  });

  it("only a thread that allows it takes a written message", () => {
    const feedback: Thread = { id: "feedback", title: "Feedback", from: "morgana", compose: true, steps: [{ say: "Tell me." }] };
    const started = run(feedback, empty, facts()).progress;
    expect(started.done).toBe(false); // a feedback thread never ends
    expect(post(feedback, started, "Love it", "Ren").messages.at(-1)).toEqual({ side: "me", from: "Ren", text: "Love it" });
    expect(post(onboarding, empty, "hi", "Ren")).toBe(empty);
    expect(post(feedback, started, "  ", "Ren")).toBe(started);
  });

  it("skipping ends a thread at once, keeps what was said, and asks nothing more", () => {
    const part = run(onboarding, empty, facts()).progress;
    const skipped = skip(onboarding, part);
    expect(skipped.done).toBe(true);
    expect(skipped.cursor).toBe(onboarding.steps.length);
    expect(texts(skipped)).toEqual(["Oi.", "Name?"]);
    expect(pendingAsk(onboarding, skipped)).toBeNull();
    expect(skip(onboarding, undefined).done).toBe(true); // skipping before it has started
  });
});

describe("triggers", () => {
  const none: Progress = {};
  it("first_visit needs a first visit and the player inside", () => {
    expect(triggered(onboarding, facts({ firstVisit: true }), none)).toBe(true);
    expect(triggered(onboarding, facts({ firstVisit: false }), none)).toBe(false);
    expect(triggered(onboarding, facts({ firstVisit: true, entered: false }), none)).toBe(false); // still on the splash
  });

  it("an unlock thread starts only when that location can be entered: a held one waits", () => {
    expect(triggered(ryuji, facts({ unlocked: ["leblanc", "ryuji"] }), none)).toBe(true);
    expect(triggered(ryuji, facts({ unlocked: ["leblanc"] }), none)).toBe(false);
  });

  it("a release note waits for onboarding to finish, and for its own version", () => {
    const notes: Thread = { id: "whats-new", title: "What's new", from: "morgana", trigger: { on: "release", version: "0.1" }, steps: [{ say: "New." }] };
    expect(triggered(notes, facts({ firstVisit: true }), none)).toBe(false); // new player, onboarding not begun
    expect(triggered(notes, facts({ firstVisit: true }), { morgana: { cursor: 3, messages: [], done: false } })).toBe(false);
    expect(triggered(notes, facts({ firstVisit: true }), { morgana: { cursor: 8, messages: [], done: true } })).toBe(true);
    expect(triggered(notes, facts({ firstVisit: false }), none)).toBe(true); // a returning player gets it at once
    expect(triggered(notes, facts({ release: "0.2" }), none)).toBe(false);
  });

  it("an onboarded thread waits until onboarding is over, and never greets a new player", () => {
    const feedback: Thread = { id: "feedback", title: "F", from: "m", trigger: { on: "onboarded" }, steps: [] };
    expect(triggered(feedback, facts({ firstVisit: true }), none)).toBe(false); // new, onboarding not begun
    expect(triggered(feedback, facts({ firstVisit: true }), { morgana: { cursor: 3, messages: [], done: false } })).toBe(false);
    expect(triggered(feedback, facts({ firstVisit: true }), { morgana: { cursor: 11, messages: [], done: true } })).toBe(true);
    expect(triggered(feedback, facts({ firstVisit: false }), none)).toBe(true);
    expect(triggered(feedback, facts({ firstVisit: false, entered: false }), none)).toBe(false); // not before they are inside
  });

  it("a thread with no trigger is always there", () => {
    expect(triggered({ id: "feedback", title: "F", from: "m", steps: [] }, facts(), none)).toBe(true);
  });
});

describe("waitSatisfied", () => {
  it("an arrival wait without a location is never satisfied (a content mistake must not release it)", () => {
    expect(waitSatisfied({ waitFor: "arrived" }, facts({ visited: ["leblanc", "ryuji"] }))).toBe(false);
  });
  it("name_set follows the name", () => {
    expect(waitSatisfied({ waitFor: "name_set" }, facts({ name: "" }))).toBe(false);
    expect(waitSatisfied({ waitFor: "name_set" }, facts({ name: "Ren" }))).toBe(true);
  });
});

describe("stepAll", () => {
  const threads = [onboarding, ryuji];

  it("starts a thread when its trigger comes, and reports the lines the other side said", () => {
    const out = stepAll(threads, {}, facts({ firstVisit: true }));
    expect(texts(out.progress["morgana"]!)).toEqual(["Oi.", "Name?"]);
    expect(out.gained).toEqual({ morgana: 2 });
    expect(out.progress["ryuji"]).toBeUndefined(); // not unlocked yet
  });

  it("is idempotent: with nothing new it returns the same progress object and reports nothing", () => {
    const first = stepAll(threads, {}, facts({ firstVisit: true }));
    const again = stepAll(threads, first.progress, facts({ firstVisit: true }));
    expect(again.progress).toBe(first.progress);
    expect(again.gained).toEqual({});
    expect(again.effects).toEqual([]);
  });

  it("an unlock starts that character's thread, which then waits for the player to arrive", () => {
    const out = stepAll(threads, {}, facts({ unlocked: ["leblanc", "ryuji"] }));
    expect(texts(out.progress["ryuji"]!)).toEqual(["Yo!"]);
    expect(out.gained).toEqual({ ryuji: 1 });
    const arrived = stepAll(threads, out.progress, facts({ unlocked: ["leblanc", "ryuji"], visited: ["leblanc", "ryuji"] }));
    expect(texts(arrived.progress["ryuji"]!)).toEqual(["Yo!", "Took you long enough.", "Sit."]);
    expect(arrived.progress["ryuji"]!.done).toBe(true);
    expect(arrived.gained).toEqual({ ryuji: 2 });
  });

  it("the arrival exchange plays once: arriving again does nothing", () => {
    const unlocked = ["leblanc", "ryuji"];
    const there = stepAll(threads, {}, facts({ unlocked, visited: ["leblanc", "ryuji"] })); // unlock and arrival in one go
    const again = stepAll(threads, there.progress, facts({ unlocked, visited: ["leblanc", "ryuji", "ryuji"] }));
    expect(again.progress).toBe(there.progress);
  });

  it("a location that ships later starts its thread the day it ships (it joins `unlocked` then)", () => {
    const held = stepAll(threads, {}, facts({ unlocked: ["leblanc"] }));
    expect(held.progress["ryuji"]).toBeUndefined();
    const shipped = stepAll(threads, held.progress, facts({ unlocked: ["leblanc", "ryuji"] }));
    expect(texts(shipped.progress["ryuji"]!)).toEqual(["Yo!"]);
  });

  it("a thread finished earlier in the list releases a later one in the same pass", () => {
    const notes: Thread = { id: "whats-new", title: "N", from: "m", trigger: { on: "release", version: "0.1" }, steps: [{ say: "New." }] };
    const ordered = [onboarding, notes];
    const mid = stepAll(ordered, {}, facts({ firstVisit: true })).progress;
    expect(mid["whats-new"]).toBeUndefined();
    const finished = stepAll(ordered, mid, facts({ firstVisit: true, name: "Ren", missionSet: true, sessionsCompleted: 1 }));
    // The name was never answered, so onboarding is still at the question and the note still waits.
    expect(finished.progress["morgana"]!.done).toBe(false);
    expect(finished.progress["whats-new"]).toBeUndefined();
    const skipped = { ...finished.progress, morgana: skip(onboarding, finished.progress["morgana"]) };
    expect(texts(stepAll(ordered, skipped, facts({ firstVisit: true })).progress["whats-new"]!)).toEqual(["New."]);
  });

  it("does not change the progress it was given", () => {
    const given: Progress = { morgana: { cursor: 2, messages: [{ side: "them", from: "morgana", text: "Oi." }], done: false } };
    const snapshot = JSON.stringify(given);
    stepAll(threads, given, facts({ firstVisit: true, name: "Ren", unlocked: ["leblanc", "ryuji"] }));
    expect(JSON.stringify(given)).toBe(snapshot);
  });

  it("a new release note starts for a player who has read the old one, and leaves the old one alone", () => {
    const v1: Thread = { id: "whats-new-0-1", title: "N", from: "m", trigger: { on: "release", version: "0.1" }, steps: [{ say: "Old." }] };
    const v2: Thread = { id: "whats-new-0-2", title: "N", from: "m", trigger: { on: "release", version: "0.2" }, steps: [{ say: "New one." }, { say: "Another." }] };
    const read = stepAll([v1, v2], {}, facts({ release: "0.1" })).progress;
    expect(Object.keys(read)).toEqual(["whats-new-0-1"]); // 0.2 is not out yet
    const later = stepAll([v1, v2], read, facts({ release: "0.2" }));
    expect(texts(later.progress["whats-new-0-2"]!)).toEqual(["New one.", "Another."]);
    expect(later.progress["whats-new-0-1"]).toBe(read["whats-new-0-1"]); // untouched
    expect(later.gained).toEqual({ "whats-new-0-2": 2 });
  });
});
