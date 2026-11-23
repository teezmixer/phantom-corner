# Phantom Corner — final report

Written at the end of M13, 2026-11-23. Everything below is checked against the repo, not remembered: the numbers come from `docs/build/features.json`, the scores from `docs/build/taste-review.md`, the questions from `docs/build/decisions.md` and `docs/build/blocked.md`.

## 1. State

- **Live:** https://phantom-corner.vercel.app · **Demo:** https://phantom-corner.vercel.app/?demo=true (a session already under way, saves nothing).
- **Features** (165 entries): **156 pass · 9 blocked · 0 todo.** The 9 blocked are all waiting on you (section 2). Every `pass` has the check that proved it in its `evidence` field.
- **Milestones merged:** M1 to M12 (PRs #2 to #13, merge commits, CI green, preview checked against the local build each time). M13 is this report and its fixes.
- **Final checks:** typecheck, lint, 765 unit tests, the build with its performance budgets (initial JS 116 of 120 kB gzipped) and 204 Playwright tests all exit 0; the output is shown in the last message of the build.
- **Switches you can try:** `?demo=true`, `?dev=true` (grant Knowledge, unlock everything, jump anywhere, replay onboarding, crash a screen to see the crash card), `?accounts=true` (sign-in against an in-memory practice server; the code is 123456), `?community=true` (presence and a bonus-place vote on made-up numbers).

## 2. Blocked items, and what unblocks each

| Item | What is blocked | What unblocks it | Built around it |
| --- | --- | --- | --- |
| **B-10** live accounts and sync (`acct-sync-live`) | No Supabase project or keys (pre-flight P4). The SQL (`supabase/migrations/…`) is tested against an in-process Postgres, not Supabase. | Create the project, put `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local` and Vercel, apply the migration, re-run `src/sync/rls.test.ts` against it, choose an email sender (needs a domain). Then a `SupabaseBackend` for `SyncBackend` (`src/sync/types.ts`). It must throw Postgres error 23514 as `Refused`. | Everything behind `?accounts=true`, against a fake with the same contract: code sign-in, sync, sign out, export, delete, the save prompt, the sync-down dot. |
| **B-11** community numbers | Presence and the vote need a server and a decision about what presence may collect. | Decide what presence collects and for how long; a backend. Then a real `CommunityBackend` (`src/community/types.ts`). | Both behind `?community=true`, on made-up numbers that say "practice". |
| **B-09** the level widget's bar (`prog-unlock-im`) | Spec §3.4 says there is never a progress bar toward the next unlock; the level bar fills toward the next level, and unlocks sit on levels, so it hints at them. | Your ruling: keep it, hide it, or show it only between unlock levels. | The IM reveal is built and tested; the bar is as designed in Figma. |
| **B-06** hand-drawn month numeral and sign (`datetime-month-art`) | Your instruction: no hand-drawn assets until you say. Only October exists in Figma. | Tell me the assets are ready (one drawing per month). | Cult UI rolling number for the date; Phosphor pin plus the place name for the sign. |
| **B-05** the background screenshot | It is a game render with a video player's bar and a cursor baked in, 1.56 MB (over the 250 kB image budget; exempt by name). The brief forbids touching it. | An original scene, or your approval to crop or replace this file. | Left untouched; the CI budget exempts exactly this file. |
| **B-07** real sounds, ambience and music | No licensed files exist; none may come from the game; no track ids in the spec. | Royalty-free sounds with a licence per file, and your choice of tracks per place. | Web Audio synthesised sounds and a shared three-track YouTube playlist (D-26). |
| **B-08** sending feedback | The feedback thread only keeps messages on the device. | Where feedback should go, the privacy wording, and a backend. | Kept locally, said so in Morgana's voice. |
| **B-03** Vercel preset says Create React App | Dashboard setting. | Optional: switch the preset to Vite. | `vercel.json` overrides it per deploy. |
| **B-04** previews are behind Vercel login | Deployment Protection. | Optional: a Protection Bypass for Automation secret. | `vercel curl` and local production builds; production is public. |
| Out of scope (`oos-1` to `oos-6`) | MMD scenes, the Phantom Thieves HQ integration, real art/sounds/fonts, hosted music, the spec §6.7 cut list, a phone layout (D-11). | Your call on each; none were built. | — |

## 3. Decisions and questions for you

Every `D-xx` in `docs/build/decisions.md`. Each placeholder is built, working and marked `// DECISION: <id>` in code. Ordered by how much work each unblocks. The spec's own recommendation is in the log entry; I have not applied any visual or product decision of mine as final.

**Infrastructure and privacy (unblock the most)**
- **D-35 / B-10:** what syncs. Today the event log and three documents (settings, mission, todos) do; **not** your name, the calendar, visited places, or story progress, so a returning player on a new device gets Knowledge back but replays the story and loses the calendar. Say if those should sync (two more documents). Event times are the push time until events carry their own (my recommendation: stamp a time on every event now, while the log is only local).
- **D-14 / D-34:** analytics is **on by default** (provisional). The privacy wording, the About text ("not meant for children"), a contact address, and a licence (spec D11) are drafts. Say whether analytics should be off until the player chooses.
- **D-34:** the share image and address: there is no `og:image`, `og:url` or canonical link yet (no original art, no final domain).
- **D-36 / B-11:** what presence may collect; whether the vote should name closed bonus places and whether it should decide anything.

**Assets**
- **D-12 / B-05:** the borrowed background screenshot and the commercial fonts in `public/fonts/` are untouched. All three reviewers named the background as the largest single problem (see section 4).
- **D-13 / B-07, D-25, D-26/D-09:** real sounds and music (placeholders: synthesised tones, three "Lyn – Topic" tracks shared by every place).
- **D-21 / B-06:** your hand-drawn month numerals and sign, paused.
- **D-36:** art for the illustrated menu (Student Ren), Morgana, night variants of each place, a drawn sign fold.

**Visual identity** (placeholders in the files listed in section 5)
- **D-05 / D-27:** where the TV sits and that it stays above every screen. **D-20 / D-23:** slot positions and sizes versus Figma. **D-30:** menu angles, stagger, wipe slant, 420 ms fade, two reduced-motion paths. **D-31:** the calendar's look and stamp icons. **D-33:** travel's look and timings (300/800/300 ms), the arriving sign's size (1.9×) and hold (900 ms), the map's layout and "Place N" numbers. **D-34:** the demo tag, crash card and share card looks. **D-35:** the sync-down dot (the spec says "a small dot on the phone"; mine is in the window corner). **D-36:** day/night hours (06:00 to 19:00), the Morgana peek (600 ms), the sign fold (500 ms). **D-15 to D-19:** token disagreements and mappings (two values chosen to match the live gate), unloaded token fonts, placeholder grey, corner radius, shadcn roles. **D-01 / D-04:** tokens had no Figma variables; Tailwind version. **D-28/D-29:** Settings layout, HUD size steps, what is saved.

**Product rules**
- **D-06 / D-31:** Knowledge numbers, the level curve to 29, rewards per level. **D-07:** which place stands for each character. **D-08:** the bonus-place unlock rule. **D-22:** rules the reviews surfaced (travel mid-session, reset confirmation). **D-27:** TV rules. **D-32:** story rules (one thread per character, the phone lists only started threads, idle line after 90 s, a start line every session, onboarding runs once, "first visit" means no save existed, skip with S). **D-33:** the music stops at the reveal, not at the start of travel (D-09 says travelling stops it).
- **D-11:** a phone layout. **D-31:** the midnight rule (a session crossing midnight is stamped on the day it ended).

**Copy** (all drafts in `src/content/copy/index.ts` and `src/content/locations/*`)
- **D-10:** "not yet" menu copy and the level-up gifts. **Ryuji's and Futaba's real unlock messages (D-32):** your spec says you have written them; they are not in the handoff files. Send them and they go into `invitations`. About 120 draft lines per voice for idle, start, arrive and complete. The panel words for accounts, break, mission-complete, community and the share card (D-34 to D-36).

**Open engineering notes** (D-24 and the ADRs): event ids and timestamps; no heartbeat fallback for browsers without Web Locks (ADR 0006).

## 4. Vision-loop verdict and final scores

The journeys of spec §3.1 are walked as a real user in `e2e/journeys.spec.ts` (first visit, a session, an unlock and a trip, a return visit, the demo within ten seconds, a long-term user); with `JOURNEYS=1` it saves 13 screenshots to `docs/build/screens/M13/`. Three fresh reviewers judged them.

| Reviewer | Readiness | Build quality | Vision fit |
| --- | --- | --- | --- |
| Persona 5 fan ("would I ask whether this is official?") | 3 | 3 | 2 |
| Pre-seed founder opening the demo ("creative-director level, and builds?") | 3 | 4 | 3 |
| Senior engineer reading the repo ("does every decision have a reason?") | 4 | 4.5 | 4.5 |

Per-milestone Readiness and Build quality were at least 4 in the last round of every milestone (M1 to M12, `taste-review.md`).

**How ready is it for you to iterate on?** The engineering is ready: the loop works end to end, saves and restores, is accessible and budgeted, and the unknowns are logged as questions rather than guessed. The product is not yet ready to show publicly: it reads as a good wireframe over a borrowed screenshot, and the two outside reviewers say the same thing.

**What works:** the voice of the copy and the phone onboarding (named as charming by the fan); the product thinking and honest records (the founder: the decisions log, the unflattering review scores, "tests that could not fail" named as lessons); the pure core, sync merge as plain data, tests that fail when the code is broken, a CSP enforced in every end-to-end run (the engineer).

**What is placeholder:** section 5. In one sentence: every place's scene, every drawn thing, all sounds and music, the look of travel/menu/calendar/cards, and all draft words.

**What the reviewers said to do, and why I did not do it (Tier 3, yours):**
- *Replace or crop the background* (all three; the fan and the founder call it the biggest signal on screen: a game render with a video bar and cursor, and the only real takedown risk). It is a built asset I may not touch (P5). Smallest fix that would help: an original scene, or a crop that hides the bottom bar.
- *Give each place its own scene* so travelling feels like arriving; the arrival is currently the quietest screen. Needs your art.
- *Angled widget frames and one diagonal red wipe on "Time." and on arrival* (the fan): the Persona 5 shapes the HUD lacks. Visual identity; a proposal for you.
- *The TV's empty state looks broken on first visit* ("TV's off."): it could invite a click. Copy and look, yours.
- *Small "PLACEHOLDER" tags under widgets* break immersion: deliberate until you rule on the slab look.
- *A short screen recording in the README*, and a moodboard or Figma frame beside it, so a visitor sees creative direction while the drawn art is paused. I can add the recording on request.

**What I fixed from the three reviews (Tiers 1 and 2):** the README said you "made every decision" (now: you hold them and the builder logged questions) and has a two-minute reading path; signing in on a second device no longer counts the other device's sessions as analytics events; sync compares timestamps as instants (a server's `+00:00` against this device's `Z`) and a merged log is cut at the cap; the Privacy and README text no longer says nothing about YouTube or that there are no accounts at all. Each has a test that fails without the fix.

**Highest-value next moves**
1. Replace the background and give every place one scene (one decision, and it moves all three reviewers).
2. Rule on the 12 questions in section 3 that block the most: sync scope, analytics default, privacy wording, Ryuji's and Futaba's messages, the level bar (B-09).
3. A Supabase project: then `SupabaseBackend`, plus a contract suite run against both the fake and the migration so the fake cannot drift from the SQL (the engineer's top suggestion).
4. Stamp a time on every event now, while the log is only local (unblocks syncing the calendar and real event times).
5. Add the P5 shapes: angled frames and one red wipe on completion and arrival.

## 5. Placeholder map

Where each placeholder lives, so you can work through them. (Marker in code: `// DECISION: <id>`.)

| What | Needs | Files |
| --- | --- | --- |
| Background | Original art (B-05) | `src/screenshot-2026-06-14-at-9-39-36-PM-1.png`, `src/app/Scene.tsx` |
| Every place's scene (all except LeBlanc), and their night variants | Art (D-36) | `src/app/Scene.tsx`, `src/content/locations/*/manifest.ts` (`scene.poster`, `scene.night`) |
| Location sign (a pin and the name in the display face) | Your drawn signs (B-06) | `src/widgets/Location/LocationWidget.tsx`, manifests `sign` |
| Month numeral and the date widget | Your month drawings (B-06) | `src/widgets/DateTime/DateTimeWidget.tsx` |
| Widget frames ("slabs") and their "PLACEHOLDER" tags | The HUD look (placeholder-slab-look) | `src/widgets/Slab.tsx`, `src/hud/slots.ts` |
| Interface sounds and per-place ambience | Real sounds (B-07, D-25) | `src/audio/sfx.ts`, `src/audio/ambience.ts` |
| Playlist | Real tracks per place (D-26) | `src/content/tracks.ts` |
| Menu look, angles, wipe; the illustrated menu's art slot and Morgana | Art and motion (D-30, D-36) | `src/screens/Menu/Menu.tsx`, `src/styles/theme.css`, `src/motion/tokens.ts` |
| Travel card, wipes, the arriving sign, the sign fold | Look and timing (D-33, D-36) | `src/screens/Travel/TravelScreen.tsx`, `src/widgets/Location/LocationWidget.tsx` |
| Map layout and "Place N" | Layout (D-33) | `src/screens/Map/MapScreen.tsx` |
| Calendar grid and stamp icons | Your calendar (D-31) | `src/components/StampCalendar.tsx`, `src/content/progression.ts` |
| Profile portrait, Settings "Ren with the mask" art slot | Art | `src/screens/Profile/ProfileScreen.tsx`, `src/screens/Settings/SettingsScreen.tsx` |
| Share card, crash card, demo tag | Look (D-34) | `src/screens/Summary/shareCardImage.ts`, `src/app/ErrorBoundary.tsx`, `src/app/App.tsx` |
| All copy marked `// draft` | Your words, in voice (D-10) | `src/content/copy/index.ts`, `src/content/locations/*`, `src/content/threads.ts` |
| Ryuji's and Futaba's unlock messages | The real lines (D-32) | `src/content/copy/index.ts` (`invitations`) |
| Privacy, About, Credits text | Your wording, a contact address (D-34) | `src/screens/Pages/Pages.tsx` |
| XP numbers, the curve, rewards, held-unlock rule | Product rules (D-06, D-31) | `src/content/progression.ts` (all tagged provisional) |
| Presence and vote numbers | A backend (B-11) | `src/community/fake.ts` |
| The practice account | A Supabase project (B-10) | `src/sync/fake.ts`, `src/sync/backend.ts` |

## 6. What to read first

1. **`README.md`** and **`docs/build/decisions.md`** — how it was built, and every open question, in your hands first.
2. **`docs/adr/0014-sync-behind-an-interface.md`** and `src/sync/merge.ts` — the clearest example of a decision with a reason: sync as plain data, tested, with the bugs reviewers found along the way in `taste-review.md` (M11).
3. **PR #3 (M2, the walking skeleton)** and **PR #4 (M3, saved progress and the tab lock)** — how the loop and the local-first persistence were laid down; ADR 0005 and 0006.
4. **`src/state/store.ts`** with **`src/domain/story.ts`** and **`src/domain/travel.ts`** — one reducer, pure domain modules, the thread interpreter and the travel machine (ADR 0009, 0010).
5. **`docs/build/taste-review.md`** — every milestone's scores, what the reviewer found, what was fixed, and what was left for you.
