# Phantom Corner — project guide for Claude Code

A Persona 5–themed study-atmosphere web app (fan project). Ares is product owner and creative director.
The full build brief is `handoff/BUILD-PROMPT.md`; the long-term spec is `handoff/phantom-corner-spec.md`
(both local-only, excluded via `.git/info/exclude` — never commit them; the repo is public).

## Start of every session

1. Read `docs/build/RESUME.md` first, then `docs/build/progress.md` (tail), `git status`, `git log --oneline -20`.
2. Reconcile uncommitted edits (finish and commit, or revert and note it). Append "resumed after stop" to `progress.md`.
3. Continue from RESUME's next step. Don't redo work already committed and marked `pass`.

## Harness (keep current)

| File | Purpose |
| --- | --- |
| `docs/build/RESUME.md` | Checkpoint. Overwrite after every commit and before any long step. |
| `docs/build/features.json` | Every feature, `todo` / `pass` / `blocked`. Never delete or reword entries to look done. `pass` only after its check ran. |
| `docs/build/progress.md` | Append-only session log. |
| `docs/build/decisions.md` | Tier 3 items (`D-xx`) for Ares. |
| `docs/build/blocked.md` | Blocked items: what, why, what unblocks, what was built around it. |
| `docs/build/taste-review.md` | Feedback-loop scores per milestone. |
| `docs/build/figma-main-screen.md` | Slot map transcribed from the Figma frame. |
| `docs/build/screens/<milestone>/` | Screenshots. |
| `docs/adr/NNNN-title.md` | Tier 2 engineering decisions. |

## Decision tiers

1. **Decided** — spec DECIDED/BUILT items, pre-flight answers, the build prompt: follow.
2. **Engineering** — reversible technical choices: decide, record an ADR.
3. **Ares decides** — any visual identity (colour, type, layout outside Figma, art, icon style, motion character),
   product rules (XP numbers, unlock levels, copy beyond drafts), anything public-facing or irreversible:
   build the most neutral working placeholder, mark it `// DECISION: <id>`, log it in `decisions.md`.
   Provisional numbers live in one content file each, tagged `provisional`.

## Hard rules

- Colour and type **only** from design-system tokens (CSS variables + `DESIGN.md`). No new hex, gradient, shadow colour or font.
- No Atlus/SEGA assets, no hosted music, no money features. Figma reference layers are never exported.
- YouTube player: always visible, ≥200×200 CSS px, never covered, user-initiated playback, one per page, Knowledge never tied to music.
- Never build spec §6.7 cut-list items (hidden player, notes, Spotify, real weather, co-study, task integrations, leaderboards, streaks, payments, app stores).
- Keep BUILT: corner-anchored HUD scaling (`DECISIONS.md`), `LocationWidget` + Café Leblanc sign, mobile gate, self-hosted `@font-face`.
- `public/fonts/`, the background screenshot and git history are untouched. Secrets only in `.env.local`; never print or commit them.
- Placeholder sounds are synthesised with Web Audio; no audio files.
- Icons: Phosphor for app-level icons; lucide only inside adopted Cult UI components.

## Git and deploy

- One feature or fix per commit, Conventional Commits (`feat(timer): …`). No WIP, no mixed commits.
- One branch + PR per milestone (`m3-core-loop`). PR body: what changed + screenshots, "Concepts in this PR", "Explain it back", decisions logged, features passed.
- Merge commits (not squash) once CI is green and the Vercel preview is verified (pre-flight P3). Never force-push.
- Vercel deploys via its GitHub integration (no CLI here); check previews with `gh api repos/teezmixer/phantom-corner/deployments`.

## Commands

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Dev server | `npm run dev` (port 5173; `.claude/launch.json` has `dev` and `preview`) |
| Production build | `npm run build` → `dist/` |
| Typecheck / lint | `npm run typecheck` · `npm run lint` |
| Unit + component tests | `npm test` (Vitest, jsdom, `src/**/*.test.ts(x)`) |
| End-to-end | `npm run e2e` (Playwright, builds then serves `vite preview` on 4173) |

## Structure (spec §4.3)

`src/app` composition root · `src/hud` corner groups, scaling, slots · `src/widgets/<Name>` · `src/screens/<Name>` ·
`src/content` locations, threads, copy, progression data · `src/domain` pure logic (no React) · `src/state` store + persistence ·
`src/audio` · `src/motion` · `src/styles` (`tokens.css` is the only colour/type source; `theme.css` maps Tailwind; `shadcn.css` maps shadcn roles) ·
`src/lib/utils.ts` (`cn`) · `e2e/` Playwright · `docs/adr/` ADRs.

## Verification format

```
✅ VERIFIED: <what> | <command> | <key output>
❌ FAILED: <what> | <command> | <error> | next: <step>
⚠️ PARTIAL: <working> | not verified: <what and why>
```
Never write ✅ without a command that proved it.
