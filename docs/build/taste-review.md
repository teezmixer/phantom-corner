# Taste review — feedback-loop scores per milestone

| Milestone | Round | Readiness | Build quality | Vision fit | Remaining gap |
| --- | --- | --- | --- | --- | --- |
| M3 | 1 | 3 | 3 | 4 | lock-before-read race, backup safety, silent write failures, value validation (all fixed after) |
| M2 | 2 | 4 | 4 | 3 | timer/todo/phone fit (fixed after); empty slabs, faces, TV placement are Ares's |
| M2 | 1 | 2 | 3 | 2 | stuck timer, dead padding, TV covered, focus, shortcuts, reduced motion |
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

## M2 — walking skeleton

**Round 1** (fresh Opus reviewer; `screens/M2/`): Readiness 2, Build quality 3, Vision fit 2.
- Fixed (Tier 1/2): finished timer stuck after travel (reducer + Start control + tests); unlayered CSS reset that disabled all Tailwind spacing; TV covered by overlays (z-order, gutter, not inert, e2e under every layer); focus trap/restore and inert room; M/N/H/Space/Esc shortcuts (pure, tested); reduced motion (MotionConfig, rolling number, static timer icon); copy moved into content/copy; map contrast; two-step reset keeping demo; CLOSE_LAYER from info pages → Settings; e2e fails on console/page errors; dead upstream code removed.
- Disputed: "Doctor Punk lacks H" — verified in a real browser that it renders every glyph; the symptom was the padding bug clipping a hairline H. Headings moved to Expose anyway (D-22).
- Deferred: analytics gating and bundle splitting (M10 budgets / settings switch).

**Round 2**: Readiness 4, Build quality 4, Vision fit 3. Remaining Tier 1 (timer overflow at 2560, phone list cut-off, hidden demo todo) fixed afterwards (D-23, scroll cue).
- **Tier 3 proposals for Ares:** heading/display faces and the timer face fallback (D-16, D-22); how much empty black slab is acceptable and the overall HUD look (placeholder-slab-look); TV placement (D-05); travel-mid-session and reset-confirmation rules (D-22); slot sizes vs Figma (D-20, D-23). The taste tool's shadow, font-count, eyebrow and few-pictures findings are landing-page rules and do not apply to a one-screen HUD.

## M3 — core loop in depth

**Round 1** (fresh Opus reviewer; `screens/M3/`): Readiness 3, Build quality 3, Vision fit 4.
- Fixed (Tier 1/2): storage was read before the session lock was held (now read inside the owner-only `<Session>`); StrictMode lock leak and takeover-flag double read; backups must verify and are capped at 5, newer-build data is never overwritten, unreadable data with an unverifiable backup runs memory-only; failed saves mid-session raise a visible notice; the guard rejects impossible values and recoverable oddities are repaired on load; mission/todo/duration limits enforced in the store; remaining time clamped (clock moved back); dev mode is read-only; countdown recomputes on `visibilitychange`; lock screen focuses its button.
- Evidence corrected: `timer-accuracy` (no real hidden-tab test is possible in Playwright), `session-two-tab-lock` (now also proves carry-over), `timer-complete`, `q-storage-adapter`, `entry-demo-memory`; closed-tab test now checks Profile totals (1 session / 25 min / 30 Knowledge) so a double count would fail; tab-lock screenshots now use the real viewport sizes.
- Not done, with reasons: owner token on each write (needs a schema field; residual ≤250 ms window only on deliberate takeover — ADR 0005); Web Locks fallback heartbeat (ADR 0006); event ids/timestamps (D-24, planned for the M11 migration).
- **Tier 3 for Ares:** confirm the schema departure from spec §4.7 (numeric todo ids, events without id/at — D-24); lock-screen and Morgana notice copy are drafts (D-10).
