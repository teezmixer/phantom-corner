# 0002 — Vite, Vitest and TypeScript 5 replace Create React App

- **Status:** accepted (pre-flight P2; spec CHANGE-6)
- **Context:** CRA is unmaintained, pins TypeScript 4.9 and cannot host Tailwind v4 or the shadcn setup Cult UI needs.
- **Decision:** Vite 8 + `@vitejs/plugin-react`, Vitest 5 with jsdom, TypeScript 5.9 strict (`noUncheckedIndexedAccess`), ESLint flat config, Playwright against `vite preview`. `index.html` lives at the root; the `@/` alias maps to `src/`.
- **Rejected:** staying on CRA and hand-porting Cult UI (pre-flight P2 "No"); Next.js (no server needs, adds routing and RSC concepts the app does not use).
- **Consequences:** builds go to `dist/`, so `vercel.json` overrides the project's CRA preset (blocked.md B-03). Env vars become `VITE_*`. Tests run in one runner for unit and component code.
