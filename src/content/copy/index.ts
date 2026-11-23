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
  saveAfter: "Either way, it's your call. If you change your mind, it's in Settings.", // draft
  keepStudying: "Keep studying and you'll find new places — and new people.", // draft (FigJam sticky)
  /** The level-up line when the next location is not ready yet (spec §3.4: "someone has been asking about them"). */
  someoneAsking: "Someone's been asking about you. Not yet — but soon.", // draft
} as const;

/**
 * The onboarding conversation, in Morgana's voice (spec §3.5). The mission question is Ares's own line, VERBATIM
 * (`widgets.missionEmpty`). DRAFTS (D-10). `{name}` is the player's name.
 */
export const onboarding = {
  greeting: "Oi. You made it. I'm Morgana, and I'll be doing the talking.", // draft
  askName: "First things first. What do I call you?", // draft
  afterName: "{name}. Fine. It suits you.", // draft
  afterMission: "A mission, written down. That's already worth something. There — Knowledge. And look, a map.", // draft
  startTimer: "Now start the timer. I'll stay out of your way.", // draft
  afterSession: "Not bad at all. Keep that up and people will start to notice.", // draft (does not promise a message: a short first session may not unlock anyone yet)
} as const;

/**
 * The first message each character sends when their place opens (spec §3.4: the reveal is always an IM from that
 * character). Two lines each, in their voice. The spec says Ares has written Ryuji's and Futaba's; they are not in the
 * handoff files, so these are DRAFTS standing in for them (D-10, D-32).
 */
export const invitations: Record<string, readonly string[]> = {
  ryuji: ["Yo! Found a spot.", "Come up to the roof when you're ready. Bring notes. Snacks too, if you're a good person."],
  ann: ["Got a sunny seat saved for you.", "Crepes after, okay? Come find me."],
  yusuke: ["I have found the ideal light.", "Come. It will not wait forever."],
  makoto: ["The library is quiet today. I reserved a table.", "Phones on silent, please. See you there."],
  futaba: ["ok so. you can come over.", "don't be weird. also bring snacks. not optional."],
  haru: ["The garden is lovely this morning. Join me?", "I'll have tea ready. No hurry at all."],
  akechi: ["There's a seat at the bar. Late, as usual.", "Don't keep me waiting too long. Patience isn't my strong suit."],
};

/** The release note and the feedback thread, in Morgana's voice. DRAFTS (D-10). */
export const noticeboard = {
  whatsNew: ["New version. Here's what's in it.", "The room, the timer, the map, a few new faces, and a calendar of the days you studied.", "Everyone who asked for this: thank you. It's yours."], // draft
  feedback: ["Tell me what you think. What's good, what's off, what you want next.", "It stays on this device for now. I can't send it anywhere yet."], // draft
} as const;

/**
 * What a level gives when it is not a location (spec §3.4, "no empty level-ups"), by level. Which levels give what is in
 * content/progression.ts. DRAFTS in voice (D-10); the tips are real study advice, not decoration.
 */
export const levelRewards: Record<number, string> = {
  2: "Morgana: There's a map now. Don't wander off.",
  4: "A new stamp for your calendar: star.",
  6: "Tip: write the first line of an answer before you check your notes.",
  7: "Sojiro: Still here, I see. Good.",
  9: "Tip: a five-minute break is part of the session, not a loss.",
  10: "A new stamp for your calendar: heart.",
  11: "Morgana: Progress, at last. I knew it.",
  13: "Tip: stop in the middle of a sentence. Starting again is easier.",
  14: "Sojiro: The coffee's gone cold. Again.",
  15: "A new stamp for your calendar: moon.",
  17: "Tip: explain it out loud to someone who isn't there.",
  18: "Morgana: Look at you. Almost a proper Phantom Thief.",
  19: "A new stamp for your calendar: lightning.",
  21: "Tip: study the thing you like least while you're fresh.",
  22: "Sojiro: You've been here a while. Don't tell the others.",
  23: "A new stamp for your calendar: crown.",
  24: "Tip: sleep is studying too. Go to bed.",
};

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
  reload: "Reload", // draft (the one button on the app-error card)
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

/** The demo tag (spec §3.12) and the pages behind the Settings → About / Credits / Privacy buttons. All DRAFT (D-10, D-14). */
export const demo = {
  tag: "Demo",
  fan: "Fan project",
  howBuilt: "How this was built",
} as const;

/** The words on the shareable session card (spec §5). DRAFT (D-10); never the player's own words. */
export const shareCardText = {
  title: "PHANTOM CORNER",
  minutesLabel: "minutes focused",
  knowledge: "Knowledge",
  fan: "A fan-made study room. Not affiliated with ATLUS or SEGA.",
} as const;

/** Where "How this was built" goes: the README's section of that name in the public repository. */
export const HOW_BUILT_URL = "https://github.com/teezmixer/phantom-corner#how-this-was-built";

/** Session-end choices (FigJam flow). */
export const sessionEnd = {
  heading: "Time.", // draft (Joker: two or three words)
  goOn: "Go on",
  takeFive: "Take five",
  changeLocation: "Go somewhere else",
  finish: "Call it",
  breakHeading: "Breathe.", // draft
  breakBack: "Back to it",
  breakSkip: "Skip the rest", // draft
  breakLength: "Break length", // draft
  breakMinutes: (n: number) => `${n} min`,
  summaryContinue: "One more",
  summaryFinish: "Done for today",
  shareCard: "Save a card", // draft (spec §5: a PNG with minutes, Knowledge and the place; never your name or mission)
  shareCardFailed: "The card wouldn't draw.", // draft
} as const;

/** Labels used by screens and widgets. DRAFTS (decision D-10). */
export const ui = {
  /** The calendar of studied days (spec §3.4): a stamp on each day, and never a count or a streak. */
  calendar: {
    label: "Days you studied",
    previous: "Previous month",
    next: "Next month",
    studiedDay: (day: number) => `${day}, studied`,
    weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
  /** The phone's thread view. */
  thread: { saveYes: "Yes, save it", saveNo: "Not now", skip: "Skip (S)", you: "You", yourName: "Your name", writeFeedback: "Write feedback", send: "Send" },
  /** The hideout menu (spec §3.7). Joker's voice: two or three words, imperative. */
  profile: { title: "Profile", portrait: "Portrait art slot", knowledge: "Knowledge", level: "Level", sessions: "Sessions", minutes: "Minutes focused", memberSince: "Member since", roster: "Roster", rosterEmpty: "No one yet." },
  menu: { title: "Hideout", study: "STUDY", map: "MAP", messages: "MESSAGES", profile: "PROFILE", settings: "SETTINGS", close: "CLOSE" },
  hideUi: "Hide UI",
  /** The bottom bar's buttons (their key hints are drawn as keycaps beside them). */
  bar: { menu: "Menu (M)", map: "Map (N)", hide: "Hide UI (H)" },
  showUi: "Show UI",
  stamped: "Today is stamped.",
  defaultName: "Student Ren",
  placeholderMarker: "placeholder",
  settingsNotYet: "Volumes, HUD size, motion, menu style, analytics, export and delete: not yet.",
  lockedPlace: (n: number) => `Place ${n}`,
  /** A place that is not open yet. It does not say when: nothing telegraphs what unlocks (spec §3.4). */
  locked: "Locked",
  youAreHere: "You are here",
  deadline: { dueIn: (span: string) => `due in ${span}`, overdueBy: (span: string) => `overdue by ${span}`, dueNow: "due now", day: "day", days: "days", hour: "h", minute: "min" },
  banner: {
    knowledge: (n: number) => `+${n} Knowledge`,
    level: (n: number) => `Level ${n}`,
    missionDone: "Mission complete.", // draft (spec §3.6 "mission-complete moment")
    breakOver: "Break's over. Back to it when you're ready.", // draft
  },
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
  menuStyleIllustrated: "Illustrated Student Ren (art slots)",
  menuArtSlot: "Student Ren art slot",
  menuMorgana: "Morgana, peeking out of the bag (placeholder)",
  analytics: "Anonymous visit statistics",
  analyticsNote: "Page views, speed, and which place, how long and how far you went. Never anything you write. A change applies at once.",
  account: "Account",
  accountNote: "Accounts: not yet. Everything is saved in this browser.",
  /** The account panel (behind ?accounts=true until the live backend exists, B-10). DRAFTS (D-10, D-35). */
  accountPanel: {
    fakeNote: "Practice mode: nothing leaves this browser. The code is 123456.",
    email: "Email",
    sendCode: "Send code",
    code: "Six-digit code",
    signIn: "Sign in",
    signedInAs: "Signed in as",
    syncNow: "Sync now",
    synced: "Everything is saved to your account.",
    signOut: "Sign out",
    signOutNote: "Signing out keeps your progress on this device.",
    export: "Export my account data",
    delete: "Delete my account",
    deleteConfirm: "Press again to delete the account",
    deleteNote: "Deleting the account removes what is stored online. Progress on this device stays; Delete my data removes that.",
    badCode: "That code isn't right.",
    badAddress: "That doesn't look like an email address.",
    working: "…",
    syncedPractice: "Saved to the practice account. It ends when you reload.",
    syncDown: "Can't reach the server. Your progress is safe on this device and will go up when it can.",
    deleted: "Account deleted.",
  },
  data: "Your data",
  export: "Export my data",
  exported: "Saved as a file.",
  erase: "Delete my data",
  eraseConfirm: "Press again to delete everything",
  info: "About, credits and privacy",
  infoButtons: { about: "About", credits: "Credits", privacy: "Privacy" },
} as const;
