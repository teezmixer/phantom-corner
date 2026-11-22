# RESUME — checkpoint

- **Updated:** 2026-11-22, end of Step 0
- **Milestone / branch:** Step 0 done on `main`; next M1 on `m1-foundation` (not created yet)
- **Last commit:** see `git log -1` — "chore(harness): add Step 0 build harness and features list"
- **In progress:** nothing; no half-edited files.
- **Waiting on:** Ares to paste the `/goal` line from `handoff/BUILD-PROMPT.md`.

## Next three steps (M1)
1. `git switch -c m1-foundation`; scaffold Vite + React 19 + TS5 + Vitest in place of CRA (`package.json`, `vite.config.ts`, `index.html` at root, `tsconfig*.json`); `npm install`; keep `src/MainScreen.tsx`, `LocationWidget.tsx`, `gate/` behaviour identical.
2. Tailwind v4 (`@tailwindcss/vite`) + `npx shadcn init` with `@/` alias; consolidate tokens into `src/styles/tokens.css` (from code, see D-01) and write `DESIGN.md` per `DESIGN.md-spec.md` (local-only file, excluded).
3. Move files into the §4.3 tree one per commit; delete `src/App.tsx` + CRA leftovers; CI workflow `.github/workflows/ci.yml` (typecheck, lint, unit, build, Playwright smoke).

## Running
Nothing running. Dev server after M1: `npm run dev`.

## Open PRs
None.

## To verify next
`npm run build && npm run typecheck && npm run lint && npm test` on the M1 branch.
