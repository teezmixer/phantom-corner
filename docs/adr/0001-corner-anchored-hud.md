# 0001 — Corner-anchored HUD (backfilled)

- **Date:** 2026-11-22
- **Status:** accepted (BUILT before this build; see `DECISIONS.md`)
- **Context:** The HUD is designed on a 1440×900 Figma frame, but screens vary from 1024×600 to 5K. A single letterboxed stage left bars and let background cropping hide widgets.
- **Decision:** Four corner groups (`tl`/`tr`/`bl`/`br`), each a 1440×900 reference box pinned to its screen corner and scaled from that corner by `min(3, w/1440, h/900)` (`src/hud/useHudScale.ts`, `src/hud/CornerGroup.tsx`). The background fills the screen with `object-cover`.
- **Rejected:** a fixed letterboxed stage (bars, wasted space); fluid percentage layout (breaks the drawn proportions of HUD art).
- **Consequences:** widgets keep their drawn proportions and never clip; moving a widget is a slot-data change. The 3× cap matches the widget export resolution. The TV player must sit outside the scaled groups so its CSS size never drops under 200×200 (spec §4.4, §4.8).
