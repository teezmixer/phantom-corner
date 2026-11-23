# Phantom Corner

A calm study room with a *Persona 5* mood: set a mission, start a timer, earn Knowledge, and unlock places to work from.

**This is a fan project.** It is non-commercial and not affiliated with or endorsed by ATLUS or SEGA. No official assets are used; the background is the owner's own screenshot and the music plays through YouTube's player.

## Run it

```bash
npm ci
npm run dev        # http://localhost:5173
```

Add `?demo=true` for a demo that lands mid-session and saves nothing, or `?dev=true` for developer tools (never saved).

| Task | Command |
| --- | --- |
| Production build | `npm run build` |
| Typecheck, lint | `npm run typecheck` · `npm run lint` |
| Unit and component tests (Vitest) | `npm test` |
| End to end (Playwright, builds first) | `npm run e2e` |
| Performance budgets (after a build) | `npm run budgets` |

## How this was built

A product owner and creative director wrote the brief and made every visual and product decision; [Claude Code](https://claude.com/claude-code) wrote the code, in milestones, each on its own branch and pull request.

- **A harness, not memory.** `docs/build/` holds a checkpoint (`RESUME.md`), every feature with its status and the check that proved it (`features.json`), an append-only log (`progress.md`), blocked items and what unblocks them (`blocked.md`), and the questions that are the owner's to answer (`decisions.md`).
- **Decisions in tiers.** Reversible engineering choices are recorded as ADRs in `docs/adr/`. Anything visual or about product rules is built as the most neutral placeholder and logged for the owner, never decided by the builder.
- **Checks that can fail.** Key tests were mutation-checked: break the code on purpose and see the test fail. A fresh reviewer read each milestone's diff and screenshots and scored it (`docs/build/taste-review.md`); what they found is fixed in the same pull request.
- **Tokens only.** Colour and type come from `src/styles/tokens.css`. A test fails if a new animation uses a raw duration.

## Shape of the code

`src/domain` pure logic with no React (timer, progress, calendar, story, travel) · `src/state` one reducer and local-first persistence · `src/widgets` the HUD · `src/screens` full-screen layers · `src/content` places, threads and copy as data · `src/hud` corner-anchored scaling · `src/audio` Web Audio sounds and the YouTube player · `e2e` Playwright.

Local first: progress is saved in this browser; there are no accounts yet. See `docs/adr/` for why (corner HUD, a timer that counts to a timestamp, local persistence, a visible TV, Vite).

## Privacy

Saved in your browser only. Optional, switchable analytics send which place, how long and what level, never anything you write. See the Privacy page in the app.

## Licence of what is borrowed

Components adapted from [Cult UI](https://www.cult-ui.com) (MIT, Nolly Studio), icons from [Phosphor](https://phosphoricons.com) (MIT), animation by [Motion](https://motion.dev) (MIT).
