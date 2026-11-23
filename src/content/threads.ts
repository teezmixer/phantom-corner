/**
 * Phone thread list (spec §3.5, §3.6). M2 lists every thread; the message steps arrive with the
 * thread interpreter in M8. Titles are the speakers; bodies below are DRAFT placeholders (decision D-10).
 */
export interface ThreadMeta {
  id: string;
  title: string;
  /** What starts the thread (spec §4.6). A location named here must exist: the content test checks it. */
  trigger?: { on: "first_visit" } | { on: "unlock"; location: string } | { on: "release"; version: string };
  /** Shown in the thread view until the interpreter ships. */
  placeholder: string;
}

export const THREADS: readonly ThreadMeta[] = [
  { id: "morgana", trigger: { on: "first_visit" }, title: "Morgana", placeholder: "Oi. I'll do the talking. You do the studying." },
  { id: "ryuji", trigger: { on: "unlock", location: "ryuji" }, title: "Ryuji", placeholder: "Yo! Found a spot. Come up when you're ready." },
  { id: "ann", trigger: { on: "unlock", location: "ann" }, title: "Ann", placeholder: "Got a sunny seat saved for you." },
  { id: "yusuke", trigger: { on: "unlock", location: "yusuke" }, title: "Yusuke", placeholder: "I have found the ideal light. Come." },
  { id: "makoto", trigger: { on: "unlock", location: "makoto" }, title: "Makoto", placeholder: "The library is quiet today. I reserved a table." },
  { id: "futaba", trigger: { on: "unlock", location: "futaba" }, title: "Futaba", placeholder: "ok so. you can come over. don't be weird." },
  { id: "haru", trigger: { on: "unlock", location: "haru" }, title: "Haru", placeholder: "The garden is lovely this morning. Join me?" },
  { id: "akechi", trigger: { on: "unlock", location: "akechi" }, title: "Akechi", placeholder: "There's a seat at the bar. Late, as usual." },
  { id: "whats-new", trigger: { on: "release", version: "0.1" }, title: "What's new", placeholder: "Release notes will appear here." },
  { id: "feedback", title: "Feedback", placeholder: "Tell us what you think. It stays on this device for now." },
];
