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
