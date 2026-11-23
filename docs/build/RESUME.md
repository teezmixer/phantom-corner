# RESUME — checkpoint

- **Updated:** 2026-11-23, M11 merged (PR #12); M12 built on `m12-everything-else`, about to push and open its PR
- **Milestone / branch:** M12 everything else on `m12-everything-else`
- **In progress:** M12 built and tested (see progress.md); inventory diffed against features.json (sign fold added). Left: push, open PR, fresh Opus review, fix, merge. Then M13 (final review: re-run build, typecheck, lint, unit and e2e and show the output; the final vision loop with three reviewer personas; docs/build/FINAL-REPORT.md listing every blocked item and every decision and question for Ares; all milestones in taste-review.md with Readiness and Build quality at least 4; git status clean).
- Ares to be asked for: Ryuji's and Futaba's real unlock messages (D-32); the level-bar ruling (B-09); the map's layout and the look of travel (D-33); the share image, address and privacy wording (D-34); the Supabase project and keys, the email sender, and whether the calendar and story should sync (D-35, B-10); day/night hours and art, the illustrated menu, the sign fold and community rules (D-36, B-11).

## Rules to keep
Colour/type from tokens only; no hand-drawn assets (D-21); banned SaaS phrases; copy in content/copy; Tier 3 → placeholder + decisions.md. Kill any preview on 4173 before e2e: `lsof -ti:4173 | xargs kill`.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
