# RESUME — checkpoint

- **Updated:** 2026-11-23, M8 merged (PR #9); M9 map and travel built on `m9-map-travel`, about to open its PR
- **Milestone / branch:** M9 map and travel on `m9-map-travel`
- **In progress:** M9 built and tested (domain/travel.ts, TravelScreen, TRAVEL_REVEAL, arriving sign, map fix). Left: push, open PR, fresh Opus review, fix, merge. Then M10 hardening (error boundaries; every empty/loading/error state; accessibility pass; performance budgets in CI; analytics events; security headers; meta and share tags; README and ADRs; about, credits (incl. Cult UI) and privacy pages; share card).
- Ares to be asked for: Ryuji's and Futaba's real unlock messages (D-32); the level-bar ruling (B-09); the map's layout and the look of travel (D-33).
- The repo was removed from iCloud sync on 2026-11-23; `node_modules` is a symlink to `node_modules.nosync` (ignored by git, eslint and tsconfig).
- iCloud may have re-created sync-conflict copies (e.g. `src/app/Tv 2.tsx`); they are ignored by tsconfig/eslint/.gitignore. Delete only after verifying they match the originals.

## Rules to keep
Colour/type from tokens only; no hand-drawn assets (D-21); banned SaaS phrases; copy in content/copy; Tier 3 → placeholder + decisions.md. Kill any preview on 4173 before e2e: `lsof -ti:4173 | xargs kill`.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
