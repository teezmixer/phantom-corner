/**
 * The phone's threads (spec §3.5, §3.6, §4.6): onboarding, one thread per character, what's new, and feedback. Each is a
 * list of steps for the interpreter (domain/story.ts). The wording is in content/copy; the arrival exchange of a character's
 * thread is that location's own `arrive` lines, so adding a location's lines adds its exchange.
 * A character's thread: the invitation arrives when their place unlocks, then it waits for the player to arrive, then the
 * arrival exchange plays (once, because a thread only runs once).
 */
import type { Step, Thread } from "@/domain/story";
import { invitations, morgana, noticeboard, onboarding, widgets } from "./copy";
import { LOCATIONS } from "./registry";

/**
 * The version this build is. Each release has its OWN thread (below), which starts for a player when it names this version;
 * a new release note is a new entry in RELEASES plus a bump here, and the old notes stay readable where they were.
 */
export const RELEASE_VERSION = "0.1";
const RELEASES: readonly { version: string; lines: readonly string[] }[] = [{ version: "0.1", lines: noticeboard.whatsNew }];
export const releaseThreadId = (version: string) => `whats-new-${version.replace(/\./g, "-")}`;
export const WHATS_NEW_ID = releaseThreadId(RELEASE_VERSION);

const say = (text: string, from?: string): Step => (from ? { say: text, from } : { say: text });

const place = (id: string) => {
  const found = LOCATIONS.find((l) => l.id === id);
  if (!found) throw new Error(`content/threads.ts: no location "${id}"`);
  return found;
};

const character = (id: string, title: string): Thread => {
  const here = place(id);
  return {
    id,
    title,
    from: here.speaker,
    trigger: { on: "unlock", location: id },
    steps: [...invitations[id]!.map((t) => say(t)), { waitFor: "arrived", location: id }, ...here.lines.arrive.map((t) => say(t))],
  };
};

const leblanc = place("leblanc");

export const THREADS: readonly Thread[] = [
  {
    id: "morgana",
    title: "Morgana",
    from: "morgana",
    trigger: { on: "first_visit" },
    steps: [
      // The arrival at LeBlanc is Sojiro's own line, then Morgana takes over.
      say(leblanc.lines.arrive[0]!, "sojiro"),
      say(onboarding.greeting),
      say(onboarding.askName),
      { ask: "name" },
      say(onboarding.afterName),
      say(widgets.missionEmpty), // Ares's own line, VERBATIM
      { waitFor: "mission_set" },
      say(onboarding.afterMission),
      say(onboarding.startTimer),
      { waitFor: "session_completed" },
      say(onboarding.afterSession),
    ],
  },
  character("ryuji", "Ryuji"),
  // Spec §3.1: on arrival at Ryuji's place, in Morgana's voice. Only offered when accounts are on and the player has none.
  { id: "save", title: "Morgana", from: "morgana", trigger: { on: "save_offer" }, steps: [say(morgana.savePrompt), { ask: "save_progress" }, say(morgana.saveAfter)] },
  character("ann", "Ann"),
  character("yusuke", "Yusuke"),
  character("makoto", "Makoto"),
  character("futaba", "Futaba"),
  character("haru", "Haru"),
  character("akechi", "Akechi"),
  ...RELEASES.map((r): Thread => ({ id: releaseThreadId(r.version), title: r.version === RELEASE_VERSION ? "What's new" : `What's new ${r.version}`, from: "morgana", trigger: { on: "release", version: r.version }, steps: r.lines.map((t) => say(t)) })),
  // Not before onboarding is over: a new player is not greeted by a second thread while Morgana is still talking.
  { id: "feedback", title: "Feedback", from: "morgana", trigger: { on: "onboarded" }, compose: true, steps: noticeboard.feedback.map((t) => say(t)) },
];

export const THREAD_IDS: readonly string[] = THREADS.map((t) => t.id);
