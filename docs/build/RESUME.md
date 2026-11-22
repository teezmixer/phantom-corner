# RESUME — checkpoint

- **Updated:** 2026-11-22, M2 merged (PR #3, 5ccc85e); M3 started
- **Milestone / branch:** M3 core loop in depth on `m3-core-loop` (branched from main; nothing committed yet except this file)
- **In progress:** nothing half-edited.

## Next three steps (M3)
1. `src/state/persistence/{adapter.ts,migrate.ts,guard.ts}` per spec §4.7: one key `pc:v1`, schema version, hand-written type guard, backup of unreadable data under a dated key + `recovered` flag, debounced save (~250 ms) with flush on `visibilitychange`/`pagehide`; `memoryAdapter` for demo and tests. Tests for migrations, guard, corrupt data.
2. Wire persistence into `StoreProvider` (load on start, save on change; demo uses memory only): mission, todos, timer, locationId, events, name, settings, visited, unread. Resume after reload: running timer keeps its `endsAt`, a timer that ended while closed completes (counts as a session) on load.
3. Tab title countdown (`document.title`), two-tab lock ("LeBlanc's already open in another tab." + takeover) via Web Locks/heartbeat, mission done state, pause/resume Playwright tests with clock; then M3 review loop + PR.

## Running
Nothing required. Preview servers: `lsof -ti:4173 | xargs kill` before `npm run e2e`.

## Open PRs
None.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
