# RESUME — checkpoint

- **Updated:** 2026-11-23, M5 merged (PR #6); M6 built on m6-hideout-menu
- **Milestone / branch:** M5 HUD widgets on `m5-hud-widgets` (from main)
- **In progress:** M6 hideout menu built and tested on `m6-hideout-menu`. Left: full verify, push, open PR, fresh Opus review (screens in docs/build/screens/M6), fix, merge. Then M7.
- The repo was removed from iCloud sync on 2026-11-23; `node_modules` is a symlink to `node_modules.nosync` (ignored by git, eslint and tsconfig).
- iCloud may have re-created sync-conflict copies (e.g. `src/app/Tv 2.tsx`); they are ignored by tsconfig/eslint/.gitignore. Delete only after verifying they match the originals.

## M5 plan (spec §3.6, §3.4, §3.2 settings, §4.12) — one commit per piece
1. Schema 2→3 migration: `settings.hidden` (WidgetId[]), `hudSize` (0.85|1|1.15|1.3), `motion` ('system'|'reduced'), `analytics` (boolean). Store actions + tests.
2. Banner: queue of transient messages (Sojiro "Ah, you're back." on a return visit, Knowledge gained, unlocks), pure `bannersFor(prev,next)`, `aria-live="polite"`.
3. Settings screen: widget toggles, volumes (reuse mixer), HUD size, motion, analytics switch, export JSON, delete data (two-press, in voice), menu style slot.
4. HUD size multiplier on the corner scale; widget toggles hide single widgets (TV never hidden).
5. Motion setting overrides prefers-reduced-motion (hook + MotionConfig).
6. Analytics: `<Analytics/>`/`<SpeedInsights/>` only when the switch is on (default on, provisional, D-14).
7. Mission deadline with a countdown (pure formatter, injected time).
8. Mark features with evidence; screenshots; review; PR; merge.

## Rules to keep
Colour/type from tokens only; no hand-drawn assets (D-21); banned SaaS phrases; copy in content/copy; Tier 3 → placeholder + decisions.md. Kill any preview on 4173 before e2e: `lsof -ti:4173 | xargs kill`.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
