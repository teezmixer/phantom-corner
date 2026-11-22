/**
 * Interface copy, grouped by speaker (spec §3.8). Characters speak; the app never does.
 * VERBATIM = Ares's line, keep exactly. Everything else is a DRAFT in voice for Ares to rewrite (decision D-10).
 * Banned (spec §3.8): "Welcome back, {name}", "Get started", "Sign up", "Oops!", "Something went wrong",
 * "Awesome!", "Are you sure?", "Loading…". A content test enforces this list.
 */

export const BANNED_PHRASES = [
  "Welcome back,",
  "Get started",
  "Sign up",
  "Oops!",
  "Something went wrong",
  "Awesome!",
  "Are you sure?",
  "Loading…",
] as const;

/** Sojiro — dry, short; care shows as complaint. */
export const sojiro = {
  back: "Ah, you're back.", // VERBATIM
  appError: "Something broke. Don't look at me. Reload, I'll keep your seat.", // draft
  summaryLines: ["Not bad. Coffee's on me. Once.", "You actually stayed. Huh.", "Go home before the trains stop."], // draft
} as const;

/** Morgana — bossy, proud, never technical; says "progress", never "data". */
export const morgana = {
  loseProgress: "A Phantom Thief who loses their progress is just... a thief.", // VERBATIM
  savePrompt: "Hold up — want to save your progress?", // VERBATIM (spec §3.1)
  newLocation: "You unlocked a new location. Someone's waiting for you.", // VERBATIM
  scrambled: "Something got scrambled in my notes. We start fresh — I kept a copy, just in case.", // draft
  cantWrite: "I can't write anything down in here. Today counts, but I won't remember it tomorrow.", // draft
  keepStudying: "Keep studying and you'll find new places — and new people.", // draft (FigJam sticky)
} as const;

/** Widget prompts and states. */
export const widgets = {
  missionEmpty: "What's today's mission?", // VERBATIM
  todoEmpty: "Nothing on the list. Suspicious.", // draft (spec §3.6 sample)
  phoneEmpty: "No messages. Enjoy the quiet.", // draft (spec §3.6 sample)
  musicBlocked: "It won't start on its own. Press play on the screen.", // draft (spec §3.6 sample)
  musicUnavailable: "That tape's gone. Skipping it.", // draft
  musicOff: "TV's off.", // draft
  pausedLong: "Still on it, or calling it a night?", // draft (spec §3.6 sample)
  secondTab: "LeBlanc's already open in another tab.", // draft (spec §3.11)
  secondTabTakeover: "Study here instead", // draft
  notYet: "Not yet.", // draft — menu items that aren't built (spec §3.7)
} as const;

/** Splash and footer. */
export const splash = {
  enter: "Press to enter", // draft
  disclaimer:
    "Phantom Corner is a fan-made, non-commercial project. Not affiliated with or endorsed by ATLUS or SEGA. Persona 5 belongs to its owners.", // draft
  mute: "Sound off",
  unmute: "Sound on",
} as const;

/** Session-end choices (FigJam flow). */
export const sessionEnd = {
  heading: "Time.", // draft (Joker: two or three words)
  goOn: "Go on",
  takeFive: "Take five",
  changeLocation: "Go somewhere else",
  finish: "Call it",
  breakHeading: "Breathe.", // draft
  breakBack: "Back to it",
  summaryContinue: "One more",
  summaryFinish: "Done for today",
} as const;
