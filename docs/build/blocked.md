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
