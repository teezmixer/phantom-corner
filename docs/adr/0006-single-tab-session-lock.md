# 0006 — One tab owns the session, via a Web Lock

- **Date:** 2026-11-22
- **Status:** accepted (spec §4.7 / §3.11 PROPOSED)
- **Context:** Two tabs writing the same `pc:v1` key would overwrite each other's progress and run two timers.
- **Decision:** The page holds a Web Lock (`pc:session`) for its lifetime. A second tab fails to get it (after waiting up to 600 ms, so a reload does not lose to its own dying page) and shows "LeBlanc's already open in another tab." with a takeover button. Takeover sets a `sessionStorage` flag and reloads; the reloaded page *steals* the lock and starts from what the old owner saved; the old owner's lock promise rejects and it shows the same screen. A tab that lost the lock cancels (never flushes) its pending save. Demo mode never takes the lock.
- **Rejected:** a heartbeat key in localStorage (stale timestamps, 2–5 s of ambiguity after a crash, polling); `BroadcastChannel` alone (no ownership after a crash); allowing multiple tabs with last-write-wins (loses progress).
- **Consequences:** browsers without Web Locks treat every tab as the owner — the heartbeat fallback the spec mentions is not built; all current evergreen browsers have Web Locks. Locks are per browser profile, so a normal and a private window do not conflict (they also do not share storage).
