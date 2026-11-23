# RESUME — checkpoint

- **Updated:** 2026-11-23, M7 merged (PR #8); M8 story built on `m8-story`, about to open its PR
- **Milestone / branch:** M8 story on `m8-story`
- **In progress:** M8 built and tested (thread interpreter `src/domain/story.ts`, thread content `src/content/threads.ts`, schema 5, phone thread view, S to skip, banners for start/arrival lines). Left: verify, push, open PR, fresh Opus review, fix, merge. Then M9 (map and travel: every marker, locked and unlocked; travel state machine covering → title → revealing with asset preloading; reduced-motion path).
- Ares to be asked for: Ryuji's and Futaba's real unlock messages (D-32), and a ruling on the level widget's bar vs "no progress bar toward the next unlock" (D-32).
- The repo was removed from iCloud sync on 2026-11-23; `node_modules` is a symlink to `node_modules.nosync` (ignored by git, eslint and tsconfig).
- iCloud may have re-created sync-conflict copies (e.g. `src/app/Tv 2.tsx`); they are ignored by tsconfig/eslint/.gitignore. Delete only after verifying they match the originals.

## Rules to keep
Colour/type from tokens only; no hand-drawn assets (D-21); banned SaaS phrases; copy in content/copy; Tier 3 → placeholder + decisions.md. Kill any preview on 4173 before e2e: `lsof -ti:4173 | xargs kill`.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
