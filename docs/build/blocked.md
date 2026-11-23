# Blocked items

Format: what · why · what would unblock it · what was built around it.

## B-01 Vercel CLI — RESOLVED 2026-11-22
- Ares connected Vercel; `vercel whoami` → teezmixer. Previews are checked with the CLI and `gh api .../deployments`. Project settings are still not changed without Ares (log here if needed).

## B-02 Live Supabase accounts and sync (pre-flight P4)
- **Why:** no `SUPABASE_URL` / `SUPABASE_ANON_KEY`. **Unblock:** create the two Supabase projects (spec §4.9) and add the keys to `.env.local` and Vercel env.
- **Built around:** M11 builds against a local fake behind the sync interface; SQL migrations and RLS tests are committed but not run live.

## Out of scope (logged, not built)
- **MMD scenes** — need models; spec §6.7 cut list (CHANGE-4).
- **Phantom Thieves HQ integration** — a separate app.
- **Real art, sounds and fonts** — Ares's assets; placeholders used (see decisions D-12, D-13).
- **Hosted music** — hard constraint; YouTube embeds only.
- **Spec §6.7 cut list** — hidden player, YouTube background, real weather, notes, Spotify, five-stat system, co-study, task integrations, drag-and-drop layout, streaks/leaderboards, app stores, payments, Persona 6 concept.
- **Phone layout** — a design decision (D-11).

## B-03 Vercel project preset still says Create React App (worked around)
- **Why:** the dashboard preset outputs `build/`; Vite outputs `dist/`. Project settings are not changed by this run.
- **Built around:** `vercel.json` sets `framework: vite` and `outputDirectory: dist`, which overrides the dashboard per deploy.
- **Optional for Ares:** switch the dashboard preset to Vite so settings and repo agree.

## B-04 Vercel preview deployments are behind Vercel login (worked around)
- **Why:** Deployment Protection on previews redirects browsers to vercel.com/login; this run never signs in for Ares.
- **Built around:** preview HTML is checked with `vercel curl / --deployment <url>` (protection bypass via the logged-in CLI); visual checks run on a local production build (`npm run build && vite preview`). Production (`phantom-corner.vercel.app`) is public and checked after each merge.
- **Optional for Ares:** a Protection Bypass for Automation secret would let Playwright run against previews.

## B-05 Background screenshot over the performance budget (constraint)
- **Why:** `src/screenshot-2026-06-14-at-9-39-36-PM-1.png` is 1.56 MB (budget: largest first-load image ≤ 250 KB, spec §4.13) and shows fake player chrome and a cursor. The build brief forbids touching it (pre-flight P5) and spec CHANGE-3 / D2 asks Ares to replace it.
- **Unblock:** Ares supplies an original scene (or approves converting/replacing this file).
- **Built around:** the CI size budget (M10) will exempt this one file by name and fail on anything else over budget.

## B-06 Hand-drawn month numeral and Café Leblanc sign paused (Ares's instruction)
- **Why:** Ares said not to use his hand-drawn assets until they are finished (D-21). Affects `datetime-month-art` and the sign art in `loc-sign-current`.
- **Unblock:** Ares says the assets are ready. Month art needs one drawing per month; only October exists in Figma (`80:31`).
- **Built around:** Cult UI `rolling-number` + Phosphor icons in the date widget; Phosphor map pin + place name in the location widget.

## B-07 Real interface sounds, ambience and per-location music (assets / decisions)
- **Why:** no licensed sound files exist and none may come from the game; the spec names no track ids. **Unblock:** Ares supplies or approves royalty-free sounds (licence per file) and chooses tracks per location.
- **Built around:** synthesised tones and noise (D-25) and a shared provisional playlist (D-26); the player, mixer, volumes and rules are real and tested.

## B-08 Sending feedback (needs a backend)
- **Why:** the feedback thread captures what the player writes on their own device only. Nothing can be sent anywhere until a backend exists (spec §3.6; M11 builds the sync module with a fake when there are no credentials).
- **Unblock:** Ares decides where feedback should go (and the privacy wording that goes with it), and a Supabase project exists (P4).
- **Built around:** the thread keeps every message locally (trimmed to 500 characters), says so in Morgana's voice, and survives reloads; nothing is transmitted.

## B-09 "No progress bar toward the next unlock" versus the level widget's bar (needs Ares's ruling)
- **Why:** spec §3.4 says [DECIDED] there is never a progress bar toward the next unlock. The level widget (Figma, M5) shows a bar toward the next *level*, and unlocks sit on levels (3, 5, 8, 12, 16, 20, 25), so the bar hints at them. Which side gives way is a design decision. Affects `prog-unlock-im`.
- **Unblock:** Ares rules: keep the bar, hide it, or show it only between unlock levels.
- **Built around:** the IM reveal is built and tested; the bar is left as designed.
