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
  missionDue: "Due", // draft
  // The accessible name must contain the visible label ("Due") — WCAG 2.5.3 label in name.
  mission: { set: "Set", done: "Mission done", edit: "Edit mission", deadline: "Due — mission deadline" },
  todoEmpty: "Nothing on the list. Suspicious.", // draft (spec §3.6 sample)
  phoneEmpty: "No messages. Enjoy the quiet.", // draft (spec §3.6 sample)
  musicBlocked: "It won't start on its own. Press play on the screen.", // draft (spec §3.6 sample)
  musicUnavailable: "That tape's gone. Skipping it.", // draft
  musicOff: "TV's off.", // draft
  musicLoading: "Tuning in.", // draft
  musicPaused: (title: string) => `Paused — ${title}`, // draft
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

/** Labels used by screens and widgets. DRAFTS (decision D-10). */
export const ui = {
  /** The hideout menu (spec §3.7). Joker's voice: two or three words, imperative. */
  menu: { title: "Hideout", study: "STUDY", map: "MAP", messages: "MESSAGES", profile: "PROFILE", settings: "SETTINGS", close: "CLOSE" },
  hideUi: "Hide UI",
  showUi: "Show UI",
  stamped: "Today is stamped.",
  defaultName: "Student Ren",
  placeholderMarker: "placeholder",
  settingsNotYet: "Volumes, HUD size, motion, menu style, analytics, export and delete: not yet.",
  lockedPlace: (n: number) => `Place ${n}`,
  lockedAt: (level: number) => `Locked · reach level ${level}`,
  youAreHere: "You are here",
  deadline: { dueIn: (span: string) => `due in ${span}`, overdueBy: (span: string) => `overdue by ${span}`, dueNow: "due now", day: "day", days: "days", hour: "h", minute: "min" },
  banner: { knowledge: (n: number) => `+${n} Knowledge`, level: (n: number) => `Level ${n}` },
  mixer: "Mixer",
  tv: { region: "TV", previous: "Previous track", next: "Next track", play: "Play", pause: "Pause" },
  mixerBuses: { music: "Music", ambience: "Ambience", ui: "Interface" },
  soundOn: "Sound on",
  soundOff: "Sound off",
} as const;

/** Settings screen labels. DRAFTS (decision D-10). */
export const settings = {
  title: "Settings",
  artSlot: "Ren with the mask — art slot",
  widgets: "Widgets",
  widgetNames: { date: "Date and time", timer: "Timer", phone: "Phone", mission: "Mission", todo: "Todo list", level: "Level and Knowledge", location: "Location sign" },
  widgetsNote: "The TV and the button bar always stay.",
  volumes: "Sound",
  hudSize: "HUD size",
  hudSizes: { 0.85: "Small", 1: "Normal", 1.15: "Large", 1.3: "Largest" } as Record<number, string>,
  motion: "Motion",
  motionOptions: { system: "Follow my system", reduced: "Reduce motion" },
  menuStyle: "Menu style",
  menuStyleNow: "Hideout (text)",
  menuStyleLater: "Illustrated Student Ren — not yet.",
  analytics: "Anonymous visit statistics",
  analyticsNote: "Page views and speed only, never your mission or todos. A change applies the next time the page loads.",
  account: "Account",
  accountNote: "Accounts: not yet. Everything is saved in this browser.",
  data: "Your data",
  export: "Export my data",
  exported: "Saved as a file.",
  erase: "Delete my data",
  eraseConfirm: "Press again to delete everything",
  info: "About, credits and privacy",
  infoButtons: { about: "About", credits: "Credits", privacy: "Privacy" },
} as const;
