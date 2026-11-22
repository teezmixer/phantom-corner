/**
 * Phone thread list (spec §3.5, §3.6). M2 lists every thread; the message steps arrive with the
 * thread interpreter in M8. Titles are the speakers; bodies below are DRAFT placeholders (decision D-10).
 */
export interface ThreadMeta {
  id: string;
  title: string;
  /** Shown in the thread view until the interpreter ships. */
  placeholder: string;
}

export const THREADS: readonly ThreadMeta[] = [
  { id: "morgana", title: "Morgana", placeholder: "Oi. I'll do the talking. You do the studying." },
  { id: "ryuji", title: "Ryuji", placeholder: "Yo! Found a spot. Come up when you're ready." },
  { id: "ann", title: "Ann", placeholder: "Got a sunny seat saved for you." },
  { id: "yusuke", title: "Yusuke", placeholder: "I have found the ideal light. Come." },
  { id: "makoto", title: "Makoto", placeholder: "The library is quiet today. I reserved a table." },
  { id: "futaba", title: "Futaba", placeholder: "ok so. you can come over. don't be weird." },
  { id: "haru", title: "Haru", placeholder: "The garden is lovely this morning. Join me?" },
  { id: "akechi", title: "Akechi", placeholder: "There's a seat at the bar. Late, as usual." },
  { id: "whats-new", title: "What's new", placeholder: "Release notes will appear here." },
  { id: "feedback", title: "Feedback", placeholder: "Tell us what you think. It stays on this device for now." },
];
