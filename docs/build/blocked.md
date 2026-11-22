# Blocked items

Format: what · why · what would unblock it · what was built around it.

## B-01 Vercel CLI not installed (partial)
- **Why:** `vercel` is not on this machine. **Unblock:** not needed — Vercel's GitHub integration deploys, and `gh api repos/teezmixer/phantom-corner/deployments` shows preview/production deployments.
- **Built around:** previews verified through GitHub deployment statuses and a browser on the preview URL. Vercel project settings (e.g. output dir `dist/` for Vite) cannot be inspected or changed here; if a deploy fails on settings it is logged here, not changed.

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
