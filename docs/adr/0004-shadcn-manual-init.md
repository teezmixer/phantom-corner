# 0004 — shadcn initialised by hand, roles mapped onto tokens

- **Date:** 2026-11-22
- **Status:** accepted
- **Context:** Cult UI components expect shadcn's CSS variables (`--background`, `--primary`, `--ring`, …), `cn()` in `@/lib/utils` and `components.json`. `npx shadcn init` writes its own oklch palette into the CSS, which would add colours outside the design system.
- **Decision:** Write `components.json`, `src/lib/utils.ts` and `src/styles/shadcn.css` by hand. Every shadcn variable points at a token (D-19); `--radius` is 0 until a radius token exists (D-18). The `@cult-ui` registry is declared so `npx shadcn add @cult-ui/<name>` works.
- **Rejected:** running `shadcn init` and deleting its palette afterwards (easy to miss values; the CLI may rewrite it on later `add` runs, so `add` output is reviewed per component).
- **Consequences:** adopted components inherit the palette automatically; each adoption still needs a check for demo colours, Geist fonts and `next/*` imports.
