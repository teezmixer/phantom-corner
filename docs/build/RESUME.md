# RESUME — checkpoint

- **Updated:** 2026-11-23, M6 merged (PR #7); M7 on `m7-progression-content` (PR #8) after review round 1 fixes
- **Milestone / branch:** M7 progression and content engine on `m7-progression-content`
- **In progress:** round-1 review fixes committed (banner cap, offline level-up banners, calendar heading/year, validator gaps, ADR 0008). Left: full verify, push, refresh M7 screenshots, ask the reviewer (a3d11491c4a94b586) for round 2 (needs Readiness >= 4 and Build quality >= 4), wait for CI, mark `q-content-tests` pass once CI ran it, merge PR #8, then M8 (story: thread interpreter, Morgana onboarding, an unlock IM per character, arrival exchanges, what's-new and feedback threads).
- The repo was removed from iCloud sync on 2026-11-23; `node_modules` is a symlink to `node_modules.nosync` (ignored by git, eslint and tsconfig).
- iCloud may have re-created sync-conflict copies (e.g. `src/app/Tv 2.tsx`); they are ignored by tsconfig/eslint/.gitignore. Delete only after verifying they match the originals.

## Rules to keep
Colour/type from tokens only; no hand-drawn assets (D-21); banned SaaS phrases; copy in content/copy; Tier 3 → placeholder + decisions.md. Kill any preview on 4173 before e2e: `lsof -ti:4173 | xargs kill`.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
