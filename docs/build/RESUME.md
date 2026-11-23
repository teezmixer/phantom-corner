# RESUME — checkpoint

- **Updated:** 2026-11-23, M12 merged (PR #13); M13 (final review and report) on `m13-final-review`, about to merge
- **State:** every milestone M1–M12 merged; features 156 pass / 9 blocked / 0 todo; `docs/build/FINAL-REPORT.md` written; the three final reviewers have reported and their Tier 1–2 findings are fixed. Left: merge the M13 PR (CI green, preview checked), then run the final checks on main and show their output.
- **After that:** nothing is in progress. The next work is yours: the questions in `FINAL-REPORT.md` section 3, then the highest-value next moves in section 4.

## Rules to keep
Colour/type from tokens only; no hand-drawn assets (D-21); banned SaaS phrases; copy in content/copy; Tier 3 → placeholder + decisions.md. Kill any preview on 4173 before e2e: `lsof -ti:4173 | xargs kill`.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
