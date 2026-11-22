# Taste review — feedback-loop scores per milestone

| Milestone | Round | Readiness | Build quality | Vision fit | Remaining gap |
| --- | --- | --- | --- | --- | --- |
| M1 | 2 | 4 | 4 | 4 | none blocking; background asset and D-15…D-19 are Ares's |
| M1 | 1 | 4 | 3 | 4 | shallow tests, no a11y lint, stale comments, tracked .DS_Store, white flash, CI double build |

Findings and Tier 3 proposals are recorded under each milestone heading below.

## M1 — foundation

**Round 1** (fresh Opus reviewer; screenshots `screens/M1/`, measurements `inspect.txt`, `lint.txt`): Readiness 4, Build quality 3, Vision fit 4.
- Fixed (Tier 1/2): stale comments; `.DS_Store` untracked; html/body black background; entry imports; CI double build; ADR dates; jsx-a11y lint (ESLint pinned 9); gate headline accessible name; render tests for GateRoute, LocationWidget, CornerGroup; Testing Library cleanup.
- Discarded taste-tool findings: few-pictures, still-page, no-footage, no-hero, first-action (landing-page heuristics; a one-screen HUD has none by design).
- Not applied: background image budget (protected file → B-05); og:image (M10); `h-dvh` (M2).
- **Tier 3 proposals for Ares:** sign off D-15…D-19; supply a clean background scene without baked-in player chrome or cursor (spec CHANGE-3 / D2). Gate hard-offset shadows and tiny tracked label are BUILT style flagged by the taste lint; left as is.

**Round 2** (same reviewer, re-verified typecheck/lint/24 tests/build): Readiness 4, Build quality 4, Vision fit 4. No Tier 1 items left. Readiness short of 5: baked-in fake player chrome in the background (owner asset) and unsigned D-17. Build quality short of 5: no asset-size budget yet (M10, B-05).
