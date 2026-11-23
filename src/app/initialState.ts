import { dayKey } from "@/domain/calendar";
import { MINUTE, transition, initialTimer } from "@/domain/timer";
import { initialState, type AppState, type Layer } from "@/state/store";

export interface UrlMode {
  demo: boolean;
  dev: boolean;
  at: string | null;
}

/** Read the mode switches from a query string: ?demo=true, ?demo=true&at=summary|menu, ?dev=true (spec §3.12). */
export function parseMode(search: string): UrlMode {
  const p = new URLSearchParams(search);
  return { demo: p.get("demo") === "true", dev: p.get("dev") === "true", at: p.get("at") };
}

const DEMO_AT: Record<string, Layer> = { summary: "summary", menu: "menu" };

/**
 * Starting state. Normal visits start at the splash. Demo mode lands in the middle of a session — timer about 17
 * minutes left, a mission, two todos, one unread message — in memory only (spec §3.12). `now` is injected.
 */
export function buildInitialState(mode: UrlMode, now: number): AppState {
  if (!mode.demo) return initialState;
  const running = transition(initialTimer, { type: "START", now: now - 8 * MINUTE });
  const base: AppState = {
    ...initialState,
    demo: true,
    entered: true,
    layer: "main",
    name: "Demo",
    mission: "Finish chapter 3",
    todos: [
      { id: 1, text: "Summarise the reading", done: false },
      { id: 2, text: "Do practice problems", done: false },
    ],
    nextTodoId: 3,
    timer: running,
    events: [{ kind: "mission_first_set" }],
    unreadThreads: ["morgana"],
  };
  const layer = mode.at ? DEMO_AT[mode.at] : undefined;
  if (!layer) return base;
  const done = { kind: "session", plannedMs: 25 * MINUTE, focusedMs: 25 * MINUTE, outcome: "completed" } as const;
  if (layer !== "summary") return { ...base, layer };
  // The demo summary shows a lived-in calendar: today and a scatter of earlier days, in the designs earned by then. The demo
  // player has 125 Knowledge (level 4), so the newest design (the star, from level 4) is only on the most recent days.
  // Days are stepped with the calendar (not by 24 hours) so a daylight-saving change cannot skip or repeat one.
  const dayAgo = (back: number) => { const d = new Date(now); d.setDate(d.getDate() - back); return dayKey(d.getTime()); };
  const studiedDays = [13, 11, 8, 7, 4, 2, 0].map((back, i) => ({ day: dayAgo(back), style: i < 4 ? 0 : 1 })).sort((a, b) => (a.day < b.day ? -1 : 1));
  return { ...base, layer, timer: { status: "idle", durationMs: 25 * MINUTE }, events: [...base.events, { kind: "dev_grant", knowledge: 85 }, done], studiedDays };
}
