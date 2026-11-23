/**
 * The thread interpreter (spec §4.6): onboarding, every unlock invitation, every arrival exchange and every "what's new"
 * message are the same thing, a list of steps that say a line, ask for an answer, wait for something to happen, or grant
 * Knowledge. Pure: no React, no storage, no clock. The store feeds it facts about the player and keeps its progress.
 */
export type Step =
  | { say: string; from?: string; delayMs?: number }
  /** Wait for the player to type an answer. `name` stores it as their name; `save_progress` belongs to accounts (M11). */
  | { ask: "name" | "save_progress" }
  | { waitFor: "name_set" | "mission_set" | "session_completed" | "arrived"; location?: string }
  /** Knowledge, once. Not used by the M8 content (the first mission already grants its Knowledge). */
  | { grant: { xp: number; /** Names this grant, so re-ordering a thread cannot pay it twice. Defaults to the step's position. */ id?: string } }
  /** Show a widget that was hidden. Understood and skipped: progressive reveal is a design decision (D-32). */
  | { reveal: string };

export type Trigger =
  | { on: "first_visit" }
  | { on: "unlock"; location: string }
  | { on: "release"; version: string }
  /** From the moment onboarding is over (finished or skipped), or at once for a player who is not new. For threads that must not greet a new player. */
  | { on: "onboarded" }
  /** The player has reached the first place with a person in it (Ryuji's) and accounts are on and they have none: the save prompt (spec §3.1). */
  | { on: "save_offer" };

export interface Thread {
  id: string;
  /** The title in the phone's list, usually the sender. */
  title: string;
  /** Who says the lines (a speaker id from content/copy); a step may override it. */
  from: string;
  /** What starts the thread. Absent: it is always there (the feedback thread). */
  trigger?: Trigger;
  steps: readonly Step[];
  /** The player can write in it at any time (feedback). */
  compose?: boolean;
}

export interface Message {
  side: "them" | "me";
  from: string;
  text: string;
  /** Pause before this line shows when it arrives, for pacing only. */
  delayMs?: number;
}

export interface ThreadProgress {
  /** Index of the next step to run. */
  cursor: number;
  messages: Message[];
  done: boolean;
}

/** What the interpreter may look at. Everything a trigger or a wait needs, nothing it could change. */
export interface Facts {
  entered: boolean;
  firstVisit: boolean;
  name: string;
  missionSet: boolean;
  sessionsCompleted: number;
  visited: readonly string[];
  /** Locations the player can enter now (shipped and unlocked); a held one is not here. */
  unlocked: readonly string[];
  /** Accounts are on, the player is signed out, and they have arrived at Ryuji's place. */
  saveOffer: boolean;
  /** The release this build is, for `release` triggers. */
  release: string;
  /** Name to say when the player has not given one. */
  defaultName: string;
}

/** Something the interpreter asks the store to do. */
export type Effect = { kind: "grant"; xp: number; key: string };

export const MAX_MESSAGES = 200;
export const MAX_ANSWER_LENGTH = 500;
const clean = (text: string) => text.trim().slice(0, MAX_ANSWER_LENGTH);

export type Progress = Readonly<Record<string, ThreadProgress>>;

const NAME = /\{name\}/g;
// A function, not a string: a name such as "Ren$&" must be said as typed, not read as a replacement pattern.
const fill = (text: string, facts: Facts) => text.replace(NAME, () => facts.name || facts.defaultName);

/** Has this wait been satisfied by what the player has done? */
export function waitSatisfied(step: Extract<Step, { waitFor: string }>, facts: Facts): boolean {
  switch (step.waitFor) {
    case "name_set": return facts.name !== "";
    case "mission_set": return facts.missionSet;
    case "session_completed": return facts.sessionsCompleted > 0;
    case "arrived": return step.location !== undefined && facts.visited.includes(step.location);
  }
}

/** Is the player past onboarding: inside, and either finished or skipped it, or not new in the first place? */
const onboarded = (facts: Facts, progress: Progress) => facts.entered && (progress["morgana"]?.done ?? !facts.firstVisit);

/** Is this thread's starting condition met? A thread without a trigger is always available. */
export function triggered(thread: Thread, facts: Facts, progress: Progress): boolean {
  const t = thread.trigger;
  if (!t) return true;
  switch (t.on) {
    case "first_visit": return facts.entered && facts.firstVisit;
    case "unlock": return facts.unlocked.includes(t.location);
    // A release note waits until the player has finished or skipped onboarding, so a new player is not greeted by two threads.
    case "release": return facts.release === t.version && onboarded(facts, progress);
    case "onboarded": return onboarded(facts, progress);
    case "save_offer": return facts.saveOffer && onboarded(facts, progress);
  }
}

const fresh = (): ThreadProgress => ({ cursor: 0, messages: [], done: false });

/** Run a thread forward until it must wait for the player or something to happen. Returns the same object when nothing changed. */
export function run(thread: Thread, progress: ThreadProgress, facts: Facts): { progress: ThreadProgress; effects: Effect[] } {
  if (progress.done) return { progress, effects: [] };
  let cursor = progress.cursor;
  const messages = [...progress.messages];
  const effects: Effect[] = [];
  while (cursor < thread.steps.length) {
    const step = thread.steps[cursor]!;
    if ("say" in step) {
      messages.push({ side: "them", from: step.from ?? thread.from, text: fill(step.say, facts), ...(step.delayMs ? { delayMs: step.delayMs } : {}) });
      if (messages.length > MAX_MESSAGES) messages.shift(); // the oldest go, as with the player's own lines: new news is never swallowed
      cursor++;
    } else if ("ask" in step) {
      break; // the answer arrives through answer()
    } else if ("waitFor" in step) {
      if (!waitSatisfied(step, facts)) break;
      cursor++;
    } else if ("grant" in step) {
      effects.push({ kind: "grant", xp: step.grant.xp, key: `${thread.id}:${step.grant.id ?? cursor}` });
      cursor++;
    } else {
      cursor++; // reveal: understood, skipped (D-32)
    }
  }
  const done = !thread.compose && cursor >= thread.steps.length;
  if (cursor === progress.cursor && messages.length === progress.messages.length && done === progress.done) return { progress, effects };
  return { progress: { cursor, messages, done }, effects };
}

/** The step a thread is waiting on, if it is waiting for an answer. */
export function pendingAsk(thread: Thread, progress: ThreadProgress | undefined): "name" | "save_progress" | null {
  if (!progress || progress.done) return null;
  const step = thread.steps[progress.cursor];
  return step && "ask" in step ? step.ask : null;
}

/** The player answers the question a thread is waiting on: their words are recorded and the thread moves on. */
export function answer(thread: Thread, progress: ThreadProgress, text: string, playerName: string): ThreadProgress {
  const asked = pendingAsk(thread, progress);
  const said = clean(text);
  if (!asked || !said) return progress;
  const mine: Message = { side: "me", from: playerName, text: said };
  return { ...progress, cursor: progress.cursor + 1, messages: [...progress.messages, mine].slice(-MAX_MESSAGES) };
}

/** The player writes in a thread that allows it (feedback). Returns the same progress if it does not. */
export function post(thread: Thread, progress: ThreadProgress, text: string, playerName: string): ThreadProgress {
  const said = clean(text);
  if (!thread.compose || !said) return progress;
  const mine: Message = { side: "me", from: playerName, text: said };
  return { ...progress, messages: [...progress.messages, mine].slice(-MAX_MESSAGES) };
}

/** Skip the rest of a thread with one key. What was said stays; nothing more is asked or waited for. */
export function skip(thread: Thread, progress: ThreadProgress | undefined): ThreadProgress {
  const base = progress ?? fresh();
  return { ...base, cursor: thread.steps.length, done: !thread.compose };
}

export interface StepResult {
  progress: Progress;
  effects: Effect[];
  /** Threads that gained a line from the other side, with how many, so the store can mark them unread. */
  gained: Record<string, number>;
}

/**
 * Advance every thread against the facts: start those whose trigger has come, and run the ones that are going. Threads are
 * taken in order, so an earlier one finishing (onboarding) can release a later one (what's new) in the same pass. Idempotent:
 * with nothing new to react to it returns the same progress it was given.
 */
export function stepAll(threads: readonly Thread[], progress: Progress, facts: Facts): StepResult {
  const current: Record<string, ThreadProgress> = { ...progress };
  let changed = false;
  const effects: Effect[] = [];
  const gained: Record<string, number> = {};
  for (const thread of threads) {
    let state = current[thread.id];
    if (!state) {
      if (!triggered(thread, facts, current)) continue;
      state = fresh();
      changed = true;
    }
    const before = state.messages.filter((m) => m.side === "them").length;
    const ran = run(thread, state, facts);
    effects.push(...ran.effects);
    const after = ran.progress.messages.filter((m) => m.side === "them").length;
    if (after > before) gained[thread.id] = after - before;
    if (ran.progress !== current[thread.id]) { current[thread.id] = ran.progress; changed = true; }
  }
  return { progress: changed ? current : progress, effects, gained };
}
