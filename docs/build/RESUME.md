# RESUME — checkpoint

- **Updated:** 2026-11-23, M10 merged (PR #11); M11 accounts and sync built on `m11-accounts-sync`, about to push and open its PR
- **Milestone / branch:** M11 accounts and sync on `m11-accounts-sync`
- **In progress:** M11 built and tested (see progress.md). Left: push, open PR, fresh Opus review, fix, merge. Then M12 (everything else: mission-complete moment, break screen in depth, day/night variants, illustrated menu style, Morgana transition, profile fields and calendar/roster, presence count, bonus vote, share card in depth; before closing, diff `features.json` against the inventory and build anything still `todo`; MMD scenes and HQ go to `blocked.md`), then M13 (final review, FINAL-REPORT.md, vision loop with three reviewer personas, final verify output).
- Ares to be asked for: Ryuji's and Futaba's real unlock messages (D-32); the level-bar ruling (B-09); the map's layout and the look of travel (D-33); the share image, address and privacy wording (D-34); the Supabase project and keys, email sender, and whether the calendar and story should sync (D-35, B-10).

## Rules to keep
Colour/type from tokens only; no hand-drawn assets (D-21); banned SaaS phrases; copy in content/copy; Tier 3 → placeholder + decisions.md. Kill any preview on 4173 before e2e: `lsof -ti:4173 | xargs kill`.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
