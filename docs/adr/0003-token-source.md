# 0003 — Design tokens restored from git history, Tailwind palette removed

- **Date:** 2026-11-22
- **Status:** accepted
- **Context:** The build brief says to transcribe tokens from Figma variables, but the Figma file has none (D-01). `tailwind.config.js` referenced variables (`--accentblue`, `--hud-timer-font-family`, …) whose definitions lived in `node_modules/tailwindcss/tailwind.css`, an Anima-style Figma export that disappeared when `node_modules` was untracked.
- **Decision:** Restore that export into `src/styles/tokens.css` as the single source; map it into Tailwind v4 with `@theme inline` and clear Tailwind's default colour and font scales (`--color-*: initial`). Two values that conflict with the live gate keep the live value and are logged (D-15).
- **Rejected:** inventing tokens (Tier 3); keeping Tailwind's palette available (makes off-token colours one class away).
- **Consequences:** an off-token colour class does not compile to anything; `DESIGN.md` mirrors `tokens.css`. If Ares adds Figma variables, they replace this file.
