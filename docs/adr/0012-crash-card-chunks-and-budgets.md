# 0012 — One crash card, split chunks and budgets in CI

- **Date:** 2026-11-23
- **Status:** accepted (spec §3.11, §4.13)
- **Context:** M10 hardening: a render error must never leave a blank page, and the first load must stay small without making timed moments wait on the network.
- **Decision:**
  - **`ErrorBoundary`** at the root and around each screen layer shows Sojiro's line and one Reload button. It reads nothing from the store, because the store may be what broke; saved progress is written on every change, so a reload brings the seat back. The dev panel can crash a screen or the app to see it.
  - **Chunks:** the room (HUD, TV, motion library), the summary, Settings, Profile, the break and session-end screens and the pages are separate chunks, fetched when the page is idle. Menu, map and travel stay in the entry: travel is timed to the millisecond and must not wait on the network. A chunk that fails to load lands in the crash card.
  - **Budgets** (`scripts/budgets.json`): initial JS 120 kB gzipped, first load 800 kB, any image 250 kB with the background screenshot exempt by name (B-05). `npm run budgets` checks `dist/` in CI; a Playwright test measures the real first load.
- **Rejected:** lazy-loading every screen (it broke the travel timing and a focus hand-over that assumed the next screen appears in the same tick; the carried opener is now kept until the room is back); per-icon Phosphor imports (no change: the library already tree-shakes, the weight is six styles per icon).
- **Consequences:** the room appears a moment after Enter on a cold cache; tests that touch it wait for it. The initial JS is 118 kB of 120, so adding to the entry needs a look at what else can move out. React and the store are about two thirds of it.
