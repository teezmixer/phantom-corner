# 0010 — Travel is a small machine of its own

- **Date:** 2026-11-23
- **Status:** accepted (spec §3.10, §4.10)
- **Context:** Travel is a sequence (a wipe, a title card, a wipe) whose middle part has to wait for the next place's images, without a spinner and without ever trapping the player.
- **Decision:**
  - **`src/domain/travel.ts`** is a pure machine, `covering → title → revealing → done`, fed by four events: `COVERED`, `HOLD_ELAPSED`, `ASSETS_READY` and `REVEALED`. The title card ends only when the hold has elapsed AND the images are in, whichever is later. A hold timer from another phase is ignored; images that arrive early are remembered but do not shorten the hold. Timings come from the motion tokens (cover 300, hold 800, reveal 300 = the 1400 ms `travel` token; a test keeps the sum), and reduced motion turns the two wipes into 100 ms cuts.
  - **`preload`** loads every image through an injected loader, never rejects, and gives up after 8 seconds, so a slow or broken load cannot keep the player on the card.
  - **The screen** (`TravelScreen`) only feeds the machine its timers and the images and draws the phase. At the start of the reveal it dispatches `TRAVEL_REVEAL`, which makes the destination the current place while travel is still going, so the wipe uncovers the room you are going to. `ARRIVE` ends travel and is idempotent with the reveal.
  - **The location sign** arrives big (state `signArriving`, not persisted) when a place is visited for the first time, holds for the `hold` token once the room is in view, and settles by a transform transition.
- **Rejected:** one timer for the whole sequence (it cannot wait for images); changing the place at the end of travel (the wipe would uncover the room you left); animating layout properties (only `clip-path` and `transform`, per the motion rules).
- **Consequences:** a test that wants to run travel to the end has to step time, not jump: Playwright's `fastForward` fires each due timer once, so the chained phases need `runFor`. When scene art arrives, adding its files to `imagesOf` is all travel needs.
- **Added after review:** `START_TRAVEL` is guarded in the reducer (an open place, not the current one, not while travelling). A session that finishes during travel is recorded at once but its choice screen waits: the TIMER branch leaves `layer` as "travel" and `ARRIVE` shows "choice" if the timer is complete, so a trip is never cut off half-way (the half-state after `TRAVEL_REVEAL` is why). The travel screen returns focus to the map button when it unmounts, because the map's own focus return fails while the room is inert. The arriving sign's scale and the motif's lap are tokens (`SIGN_ARRIVING_SCALE`, `travelMotif`); a test fails if any new animation in `theme.css` has a raw duration.

