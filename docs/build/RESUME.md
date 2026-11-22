# RESUME — checkpoint

- **Updated:** 2026-11-22, M2 in progress
- **Milestone / branch:** M2 walking skeleton on `m2-walking-skeleton` (not pushed yet; M1 merged to main as faefd3e)
- **Last commit:** see `git log -1`
- **In progress:** `src/domain/progress.ts` — `levelForKnowledge` is a TODO(human) for Ares (Learning style); its tests in `src/domain/progress.test.ts` define the behaviour.

## Next three steps
1. Once `levelForKnowledge` is implemented and `npx vitest run src/domain` passes, commit it.
2. `src/state/store.ts` (useReducer + context: layer, locationId, mission, todos, timer, events, flags) and `src/app/App.tsx` composing splash → main + overlay layers.
3. Widgets as working placeholders in `src/widgets/*` placed with `slotStyle(DEFAULT_SLOTS.x)`; screens in `src/screens/*`; `?dev=true` panel; `?demo=true`.

## Running
Nothing required. Dev server: preview tool `dev` (5173). `vite preview` may be on 4173 (kill with `lsof -ti:4173 | xargs kill`).

## Open PRs
None (M1 #2 merged).

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
