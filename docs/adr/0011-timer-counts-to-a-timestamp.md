# 0011 — The timer counts to a timestamp, not down by ticks

- **Date:** 2026-11-23 (decided in M3; written down in M10)
- **Status:** accepted (spec §4.5)
- **Context:** A focus timer that subtracts one second per tick drifts when the tab is hidden (browsers throttle timers to about one a minute) and cannot survive a reload.
- **Decision:** `src/domain/timer.ts` is a pure state machine. A running timer stores `endsAt`, a wall-clock timestamp; the time left is always `endsAt - now`, computed when drawn. A paused timer stores the time left. Time is passed in by events (`now`), never read inside the machine, so tests step it without a clock. A session that ended while the tab was closed is found at load and recorded as completed.
- **Rejected:** a decrementing counter (drift, lost on reload); a Web Worker ticker (more moving parts; kept as an escape hatch if late completions are reported).
- **Consequences:** moving the system clock back is clamped, and forward ends a session early and credits it in full; accepted for a trust-the-user app with no leaderboards (ADR 0005). Screen readers hear the time left in five-minute steps (`timerAnnouncement`), not every second.
