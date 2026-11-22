# RESUME — checkpoint

- **Updated:** 2026-11-22, M3 merged (PR #4, 9822b4d); M4 audio started
- **Milestone / branch:** M4 audio on `m4-audio` (from main)
- **In progress:** nothing half-edited at this checkpoint.

## M4 plan (spec §4.8, §3.9, §3.6) — do in this order, one commit per piece
1. Schema 1→2 migration (first real one): `settings.volumes {music, ambience, ui}` + `settings.ambienceMix {layerId: 0..1}`; store actions + tests.
2. `src/audio/sfx.ts` synthesised placeholder recipes (select, menuOpen, menuClose, travel, sessionStart, sessionComplete, doorbell) + `src/audio/engine.ts` (AudioContext, buses, unlock on Enter, mute) tested with a fake AudioContext.
3. `src/audio/ambience.ts` synthesised layers (rain, murmur, wind, room, city, hum) per location manifest.
4. Sound wiring: unlock on the splash click, doorbell on first arrival, ui sounds from state transitions (halved while the timer runs), ambience starts after Enter unless muted.
5. Music: pure `musicReducer` (states off/loading/playing/paused/blocked/unavailable; error 100/101/150/153 skips; all failed → unavailable), YouTube adapter + loader (script injected AFTER Enter), TV component (iframe ≥200×200 always visible, controls beside it not over it, user-started playback, one player), mixer popover. Playlists are per location; track ids are decision D-09.
6. e2e with a stubbed `https://www.youtube.com/iframe_api` fake `YT` (never hit the real network in tests); features.json; ADR 0007; screenshots; review; PR; merge.

## Rules to keep
Player always visible ≥200×200, never covered, user-initiated playback, one per page, Knowledge never tied to music; no audio files — all sounds synthesised; mute on the splash silences everything.

## To verify
`npm run typecheck && npm run lint && npm test && npm run build && npm run e2e` (kill any preview on 4173 first: `lsof -ti:4173 | xargs kill`).
