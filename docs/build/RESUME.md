# RESUME — checkpoint

- **Updated:** 2026-11-22, M1 code complete
- **Milestone / branch:** M1 foundation on `m1-foundation` (pushed; PR being opened)
- **Last commit:** see `git log -1` — "docs(build): update harness for M1"
- **In progress:** nothing half-edited.

## Next three steps
1. Open the M1 PR (`gh pr create`), wait for CI (`gh pr checks --watch` in background) and the Vercel preview (`vercel ls phantom-corner | head`).
2. M1 review loop: screenshots at 1024×600, 1440×900, 2560×1440 + reduced motion into `docs/build/screens/M1/`; fresh reviewer subagent (opus); log scores in `taste-review.md`.
3. Merge with a merge commit once green; then `git switch main && git pull --ff-only` and start M2 on `m2-walking-skeleton`.

## Running
Dev server via preview tool (`dev`, port 5173) may be running; restart with the preview tool or `npm run dev`.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e` — all exit 0 at this commit.
