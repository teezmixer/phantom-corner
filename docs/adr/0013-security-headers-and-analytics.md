# 0013 — Security headers, enforced in tests, and gated analytics

- **Date:** 2026-11-23
- **Status:** accepted (spec §4.16, §4.17)
- **Context:** A public app with an embedded YouTube player and optional analytics needs a strict policy that does not silently rot.
- **Decision:**
  - **Headers** live in `vercel.json` (CSP, Referrer-Policy, X-Content-Type-Options, Permissions-Policy). `vite.config.ts` reads the same file for `vite preview`, so every Playwright test runs under the real policy and fails on any console error, including a CSP violation. Tests prove an inline script, `eval` and a foreign script are refused. No `upgrade-insecure-requests` (it breaks localhost).
  - **Analytics** define twelve named events (ten are sent today; the two `save_prompt_*` events wait for accounts), each with only a place, a duration or a level, validated against a small pattern, so no player-written text can reach them. The send-time gate checks the Settings switch on every event; none are sent in dev mode or the demo. The opt-out is stored apart from the save, so it survives Delete.
- **Rejected:** a CSP in a meta tag (cannot set `frame-ancestors`); a hand-copied CSP in tests (would drift from production).
- **Consequences:** a new third-party origin needs a `vercel.json` edit and a decision; the privacy page and the Settings note must say what is sent (a test pins the privacy text).
