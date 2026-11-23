# Progress log (append-only)

## 2026-11-22 — Step 0
- Synced `main` to `origin/main` (`32f408d`); discarded `.DS_Store` changes. The pull untracked `node_modules`, removing it from disk (reinstall in M1).
- Figma gate passed: frame `4:2521` read (metadata, screenshot, design context). No Figma variables (D-01). Slot map in `figma-main-screen.md`. No reference layers exported.
- FigJam flow read (first visit, return visit, session loop, save prompt at Ryuji; "First Session Arc" sticky).
- Spec digested (Parts 1, 3, 4, 6, 9). `features.json`: 164 entries, all `todo`.
- Environment: Node v25.6.1, npm 11.9; `gh` logged in (teezmixer); no Vercel CLI (B-01); Playwright chromium-1208 cached, package installs in M1; all build skills present; no `~/.claude/CLAUDE.md`.
- **Next:** M1 foundation on branch `m1-foundation`.
- **Risks:** Vercel project may need its output dir changed for Vite (cannot change here); YouTube track embeddability unknown (D-09).

## 2026-11-22 — M1 foundation (branch m1-foundation)
- Ares: D-02 resolved (music vector is an internet placeholder → use Phosphor + Cult UI); Vercel CLI connected (B-01 resolved).
- CRA → Vite 8 + Vitest 5 + TS 5.9 strict; ESLint flat config; Playwright 1.65 smoke (2 tests).
- Found the lost design tokens in git history (Figma export inside node_modules/tailwindcss/tailwind.css) and restored them to `src/styles/tokens.css`. Conflicts logged as D-15; unloaded faces D-16; placeholder grey D-17; radius D-18; shadcn roles D-19.
- Tailwind v4 with `@theme inline`, default palette cleared. shadcn set up by hand (ADR 0004).
- Folder moves one per commit: Gate → screens/Gate, LocationWidget → widgets/Location, hud/ extracted, MainScreen → app/, CSS → styles/.
- Vercel project preset is still CRA → `vercel.json` overrides (B-03).
- **Slip:** commit e5239d6 ("chore: add preview launch configs") also carries the staged deletion of tailwind.config.cjs/postcss.config.cjs, so that one commit is mixed and its tree does not build. Not rewritten (history rule); the next commit 5015429 restores a green build.
- Output style switched to Learning mid-run; autonomy rules still apply, so human-contribution requests are logged in PR descriptions ("Explain it back") rather than blocking the run.
- **Next:** push, PR, CI, Vercel preview check, M1 review loop, merge.

## 2026-11-22 — M1 merged; M2 started
- M1 review: round 1 R4/BQ3/V4 → fixes → round 2 R4/BQ4/V4. PR teezmixer/phantom-corner#2 merged (merge commit faefd3e). Production deploy verified.
- M2 (branch m2-walking-skeleton, stacked on M1 and now merged with main): slot map as data (D-20), content types, provisional places (D-07) and progression (D-06, thresholds interpolated from the spec's hour anchors at ~72 Knowledge/hour), speaker-grouped copy, 12 manifests by folder glob, content test.
- **Next:** domain/progress.ts (level from Knowledge), app store + layer state, screens and widgets as working placeholders, dev panel, demo mode.

## 2026-11-22 — M2 review loop and merge
- M2 built on branch m2-walking-skeleton (PR teezmixer/phantom-corner#3). Review round 1 R2/BQ3/V2 → fixes (see taste-review.md) → round 2 R4/BQ4/V3 → small fit fixes (D-23).
- Ares's instruction mid-run: do not use hand-drawn assets for now; use Cult UI + Phosphor (D-21, B-06). Output style/model switched to Sonnet mid-run; a usage limit paused the run once and it resumed from the repo state.
- Commit-hygiene note: commit 0f2c933 and 1ba7cae are ordered store → ui → widgets → screens → app, so intermediate commits may not typecheck on their own (the build is green at each PR head).
- **Next:** merge M2; M3 core loop in depth (storage adapter with migrations/guard/backup, resume after reload, tab title countdown, two-tab lock, timer polish).

## 2026-11-22 — M3 review
- Round 1 R3/BQ3/V4. Fixed lock-before-read race, backup/newer-data safety, silent write failure, value validation, clock clamps, dev read-only, visibility recompute, focus; corrected overstated evidence; 169 unit + 45 e2e tests.
- Removed 75 untracked iCloud/macOS sync-conflict copies ("name 2.ext") after verifying each was byte-identical to the original or to a version in git history; `.gitignore` now ignores the pattern. If the repo folder keeps syncing they may reappear.
- 2026-11-22 (later): Ares approved deleting the sync-conflict copies. Deleted 83 untracked copies (each verified identical to an original or a committed version) and removed 2 tracked ones from git (src/test/setup 2.ts, src/vite-env.d 2.ts). node_modules copies left alone (inert, not ours). The folder is iCloud-synced, so copies may reappear; tsconfig/eslint/.gitignore already ignore the pattern.

## 2026-11-22 — M4 review
- Round 1 R2/BQ3/V3 → many fixes; playing the real YouTube player found a bug no test saw (transient pause on track switch) → fixed with a stub that behaves like the real player. Round 2 R4/BQ4/V4; the one blocker (abandoned player left in place) fixed. 259 unit + 70 e2e tests.
- Sync-conflict copies deleted with Ares's approval (83 untracked + 2 accidentally tracked); the repo folder is iCloud-synced, so they may reappear.

## 2026-11-22 — M5 review round 1 fixes (in progress)
- Reviewer scored M5 R2/BQ3.5/V3.5. Fixed in code (b5bd63ed and the commit before it): repair-not-reject on load, Delete wipes only real progress and keeps the analytics opt-out, sessions complete without the Timer widget, banners above screens, no greeting after recovery, deadline bounds.
- e2e now covers each of those; Delete-in-demo and opt-out-survives-Delete were mutation-checked (both fail when the fix is removed). Full e2e: 99 passed. Vitest: 318 passed (earlier run).
- Corrected overstated features.json evidence; added D-29.
- Still to do: refresh M5 screenshots, update taste-review.md, full verify (typecheck, lint, test, build, e2e) in one run, push, update PR #6, ask reviewer for round 2, merge.
- 2026-11-23: iCloud was evicting node_modules and .git (builds and pushes hung); Ares removed the folder from iCloud sync. M5 round 2: R4/BQ4/V4. Fixed the guard, repeated backups and demo opt-out findings; 100 e2e and 320 unit tests pass.

## 2026-11-23 — M5 merged, M6 hideout menu
- M5 merged (PR #6, 2dc0bc68) after round 2 (R4/BQ4/V4) and a preview bundle match.
- M6 on `m6-hideout-menu`: motion tokens (TS + CSS, parity test), diagonal clip-path wipe, staggered labels at angles, arrow/Home/End navigation with a select sound, Esc/Enter, 100 ms reduced-motion cut, focusable not-yet labels, `AudioApi.play`. Found by looking at a screenshot: a mouse resting where the menu opens stole the highlight; fixed (mouse-move, not mouse-enter) with a mutation-checked test.
- 2026-11-23: M6 review round 1 R3/BQ3/V4 → fixes → round 2 R4/BQ4/V4. Extra fixes after round 2: dev-panel key capture, 1024×600 scroll. Merging after CI and the preview match.

## 2026-11-23 — M7 progression and content engine
- M6 merged (PR #7, 80aa115a). M7 on `m7-progression-content` (PR #8): content validator, reward table for levels 2–29, curve extended to 29 for the bonus locations, held unlocks, calendar of studied days (schema 4), draft content lines.
- Review round 1: R3/BQ4/V4 → fixes (see taste-review.md). Two real bugs found by the reviewer: banners dropped under gift bursts; offline level-ups never announced.
- Slip: the first M7 evidence commit bundled e2e, docs and src in one commit (should have been separate).

## 2026-11-23 — M7 merged, M8 story
- M7 merged (PR #8, 56c61e52) after round 2 (R4/BQ4/V4). `q-content-tests` marked pass with CI run 45106934087.
- M8 on `m8-story`: pure thread interpreter, thread content (onboarding, seven characters, what's new, feedback), thread progress in the store and storage (schema 5), the phone as a real thread view, S to skip, replay in the dev panel, start and arrival banners. 29 features marked pass.
- Found while looking at screenshots: at 1024×600 the thread's log was not the scrolling element (auto-scroll did nothing and the name box was below the fold), the thread list wrapped and clipped, and long invitations made the panel too wide; all fixed.
- The spec's "Ryuji's and Futaba's unlock messages" are not in the handoff files; every unlock message is a draft (D-32).
- 2026-11-23: M8 review round 1 R3/BQ3/V4 → fixes (see taste-review.md). Mutation-checking caught two e2e tests that passed against broken code (idle lines); both rewritten.

## 2026-11-23 — M8 merged, M9 map and travel
- M8 merged (PR #9, 7f0401a4) after round 2 (R4/BQ4/V4).
- M9 on `m9-map-travel`: pure travel machine (covering → title → revealing → done, the card waits for the hold and the images), the travel screen with clip-path wipes, `TRAVEL_REVEAL`, the location sign arriving big on a first visit, reduced-motion cuts, motion tokens for the three travel parts. Fixed on the way: the map told players which level opens each locked place (it telegraphs unlocks, against spec §3.4).
- Found by looking at screenshots: a big arriving sign scaled around the whole HUD slot drifted up into the TV area; now only the visible sign scales, and an e2e checks it never reaches the TV at three window sizes. Screenshot harness: freeze the clock first, then step it with `runFor`.
- 2026-11-23: M9 review round 1 R4/BQ4/V4 → fixes (see taste-review.md): finish-mid-trip, focus after travel, reducer guards, tighter e2e, tokens. An older e2e had gone vacuous because of chained timers; found by the reviewer, fixed with `runFor` and a wait for the card to unmount.

