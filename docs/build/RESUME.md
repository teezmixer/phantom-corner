# RESUME — checkpoint

- **Updated:** 2026-11-23, M9 merged (PR #10); M10 hardening built on `m10-hardening`, about to push and open its PR
- **Milestone / branch:** M10 hardening on `m10-hardening`
- **In progress:** M10 built and tested (see progress.md). Left: push, open PR, check the preview's headers with `vercel curl -I` (then mark `q-security-headers` pass), fresh Opus review, fix, merge. Then M11 (accounts and sync: Supabase migrations and RLS tests, sync module with a local fake, email-code sign-in behind a flag, save prompt at Ryuji's arrival, export/delete; live parts blocked per P4; `save_prompt_*` analytics; `q-states` "sync down"), M12 (everything else, ten todo features), M13 (final review, FINAL-REPORT.md, vision loop with three reviewer personas, final verify output).
- Ares to be asked for: Ryuji's and Futaba's real unlock messages (D-32); the level-bar ruling (B-09); the map's layout and the look of travel (D-33); the share image, address and privacy wording (D-34).
- The repo was removed from iCloud sync on 2026-11-23; `node_modules` is a real directory again.

## Rules to keep
Colour/type from tokens only; no hand-drawn assets (D-21); banned SaaS phrases; copy in content/copy; Tier 3 → placeholder + decisions.md. Kill any preview on 4173 before e2e: `lsof -ti:4173 | xargs kill`.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
