# Taste review — feedback-loop scores per milestone

| Milestone | Round | Readiness | Build quality | Vision fit | Remaining gap |
| --- | --- | --- | --- | --- | --- |
| M4 | 2 | 4 | 4 | 4 | none blocking; D-25/D-26/D-27 are Ares's |
| M4 | 1 | 2 | 3 | 3 | clipped 196 px player, autoplay paths, demo loads YouTube, travel rule false, no retry |
| M3 | 2 | 4 | 4 | 4 | none blocking; limits and draft copy are Ares's |
| M3 | 1 | 3 | 3 | 4 | lock-before-read race, backup safety, silent write failures, value validation (all fixed after) |
| M2 | 2 | 4 | 4 | 3 | timer/todo/phone fit (fixed after); empty slabs, faces, TV placement are Ares's |
| M2 | 1 | 2 | 3 | 2 | stuck timer, dead padding, TV covered, focus, shortcuts, reduced motion |
| M1 | 2 | 4 | 4 | 4 | none blocking; background asset and D-15…D-19 are Ares's |
| M1 | 1 | 4 | 3 | 4 | shallow tests, no a11y lint, stale comments, tracked .DS_Store, white flash, CI double build |

Findings and Tier 3 proposals are recorded under each milestone heading below.

## M1 — foundation

**Round 1** (fresh Opus reviewer; screenshots `screens/M1/`, measurements `inspect.txt`, `lint.txt`): Readiness 4, Build quality 3, Vision fit 4.
- Fixed (Tier 1/2): stale comments; `.DS_Store` untracked; html/body black background; entry imports; CI double build; ADR dates; jsx-a11y lint (ESLint pinned 9); gate headline accessible name; render tests for GateRoute, LocationWidget, CornerGroup; Testing Library cleanup.
- Discarded taste-tool findings: few-pictures, still-page, no-footage, no-hero, first-action (landing-page heuristics; a one-screen HUD has none by design).
- Not applied: background image budget (protected file → B-05); og:image (M10); `h-dvh` (M2).
- **Tier 3 proposals for Ares:** sign off D-15…D-19; supply a clean background scene without baked-in player chrome or cursor (spec CHANGE-3 / D2). Gate hard-offset shadows and tiny tracked label are BUILT style flagged by the taste lint; left as is.

**Round 2** (same reviewer, re-verified typecheck/lint/24 tests/build): Readiness 4, Build quality 4, Vision fit 4. No Tier 1 items left. Readiness short of 5: baked-in fake player chrome in the background (owner asset) and unsigned D-17. Build quality short of 5: no asset-size budget yet (M10, B-05).

## M2 — walking skeleton

**Round 1** (fresh Opus reviewer; `screens/M2/`): Readiness 2, Build quality 3, Vision fit 2.
- Fixed (Tier 1/2): finished timer stuck after travel (reducer + Start control + tests); unlayered CSS reset that disabled all Tailwind spacing; TV covered by overlays (z-order, gutter, not inert, e2e under every layer); focus trap/restore and inert room; M/N/H/Space/Esc shortcuts (pure, tested); reduced motion (MotionConfig, rolling number, static timer icon); copy moved into content/copy; map contrast; two-step reset keeping demo; CLOSE_LAYER from info pages → Settings; e2e fails on console/page errors; dead upstream code removed.
- Disputed: "Doctor Punk lacks H" — verified in a real browser that it renders every glyph; the symptom was the padding bug clipping a hairline H. Headings moved to Expose anyway (D-22).
- Deferred: analytics gating and bundle splitting (M10 budgets / settings switch).

**Round 2**: Readiness 4, Build quality 4, Vision fit 3. Remaining Tier 1 (timer overflow at 2560, phone list cut-off, hidden demo todo) fixed afterwards (D-23, scroll cue).
- **Tier 3 proposals for Ares:** heading/display faces and the timer face fallback (D-16, D-22); how much empty black slab is acceptable and the overall HUD look (placeholder-slab-look); TV placement (D-05); travel-mid-session and reset-confirmation rules (D-22); slot sizes vs Figma (D-20, D-23). The taste tool's shadow, font-count, eyebrow and few-pictures findings are landing-page rules and do not apply to a one-screen HUD.

## M3 — core loop in depth

**Round 1** (fresh Opus reviewer; `screens/M3/`): Readiness 3, Build quality 3, Vision fit 4.
- Fixed (Tier 1/2): storage was read before the session lock was held (now read inside the owner-only `<Session>`); StrictMode lock leak and takeover-flag double read; backups must verify and are capped at 5, newer-build data is never overwritten, unreadable data with an unverifiable backup runs memory-only; failed saves mid-session raise a visible notice; the guard rejects impossible values and recoverable oddities are repaired on load; mission/todo/duration limits enforced in the store; remaining time clamped (clock moved back); dev mode is read-only; countdown recomputes on `visibilitychange`; lock screen focuses its button.
- Evidence corrected: `timer-accuracy` (no real hidden-tab test is possible in Playwright), `session-two-tab-lock` (now also proves carry-over), `timer-complete`, `q-storage-adapter`, `entry-demo-memory`; closed-tab test now checks Profile totals (1 session / 25 min / 30 Knowledge) so a double count would fail; tab-lock screenshots now use the real viewport sizes.
- Not done, with reasons: owner token on each write (needs a schema field; residual ≤250 ms window only on deliberate takeover — ADR 0005); Web Locks fallback heartbeat (ADR 0006); event ids/timestamps (D-24, planned for the M11 migration).
- **Tier 3 for Ares:** confirm the schema departure from spec §4.7 (numeric todo ids, events without id/at — D-24); lock-screen and Morgana notice copy are drafts (D-10).

**Round 2**: Readiness 4, Build quality 4, Vision fit 4. Remaining Tier 1 fixed afterwards: a huge stored todo list overflowed the stack on load (lists are now cut before folding and absurd sizes refused); one impossible event reset all progress (now dropped individually); mapping failures are treated as recoveries; bootstrap runs once per page load (StrictMode double-backup); a unit test proves storage is not read until the lock is granted (it fails if the old bug is reintroduced).
- **Tier 3 for Ares:** the 80-character, 200-todo and 50,000-event limits are provisional; whether "newer build's data kept untouched" deserves its own Morgana line (today it shows the cannot-write notice, though the data is preserved).

## M4 — audio

**Round 1** (fresh Opus reviewer; `screens/M4/`): Readiness 2, Build quality 3, Vision fit 3.
- Fixed (Tier 1/2): the player box clipped the 200×200 video to 196 px (now 204 outer); YouTube's default chrome restored and the privacy-enhanced host used; the reducer follows the player's own state; a track that ends advances only from playing; travel really stops playback (reset on location); the YouTube script and player wait for the first user gesture (demo mode contacts nothing at load); retry after a failed script, 10 s ready-timeout, abort signal; "blocked" only once a player exists; audio keeps trying to unlock on every gesture and never queues sounds on a suspended context; ambience fades out and shares one noise buffer; caption and mixer step aside while a screen is open; the TV never covers the todo widget on short windows; migration defaults `muted`; blocked storage no longer makes every visit a first visit; select-tick and menu-close no longer double; hard-coded strings moved to copy; several e2e tests that passed for the wrong reason rewritten (each key one confirmed to fail when its bug is reintroduced).
- **Found by playing the real YouTube player in a browser** (not by any test): pressing Next while playing froze the new track on "Paused" because the real player reports a transient pause between videos. Fixed, the e2e stub now behaves the same way, and a regression test covers it.

**Round 2**: Readiness 4, Build quality 4, Vision fit 4. One blocker fixed afterwards: a player that never became ready was left in place, so a retry could create a second live player (now destroyed, iframe removed, late events ignored; mutation-checked). Also: a pause pressed during loading is honoured if the video starts late; a very short window no longer pushes the player off-screen.
- **Tier 3 for Ares:** D-27 (the TV stays above screens and keeps playing, instead of the spec's "pause under full-screen layers"; Next/Previous start playback; the TV is not keyboard-reachable while a screen is open; two sets of controls; YouTube wording on the Privacy/About pages), D-26 (which music, per location, and whether a rights-holder upload is acceptable at launch), D-25 (placeholder sounds and default volumes).
- **Open, documented:** player errors 2/5 skip a track for the rest of the visit; a stale "playing" from the previous video right after travel can briefly mark a cued TV as playing; CSP entries and the weekly oEmbed check are M10.

## M5 — HUD widgets
**Round 1** (fresh Opus reviewer, screenshots in `docs/build/screens/M5/`): Readiness 2, Build quality 3.5, Vision fit 3.5.
- **Fixed after round 1:** one bad preference rejecting a whole save (now repaired on load); Delete wiping a real save from demo mode, rewriting an old save, and re-enabling analytics (now wipes only real progress, cancels pending saves, keeps the opt-out); a hidden Timer widget stopping sessions from ending (completion moved to an always-mounted clock); banners hidden behind screens; "you're back" after a recovered visit; editing a deadline un-completing a mission; absurd deadlines stored; small red-on-black text below 4.1:1 contrast (now white on red); copy outside `content/copy`; overstated evidence in `features.json`.
- **Evidence:** 99 Playwright tests pass; Delete-in-demo and opt-out-survives-Delete tests are mutation-checked. Decisions D-28, D-29.
**Round 2** (same reviewer, at ae5ab55f): Readiness 4, Build quality 4, Vision fit 4. No blockers. Fixed afterwards: the guard no longer rejects a save over `muted`/`volumes`/`ambienceMix`; unreadable data is not backed up again on every reload; a demo visit no longer changes the real remembered opt-out; deadline tests pin the clock; `settings-motion` description matches D-28.
- **Open (not blocking):** an out-of-range deadline is dropped silently (no `min`/`max` on the input, no message); "Mission"/"Today's mission" still hard-coded in MissionWidget; the deadline input's visible label ("Due") differs from its accessible name; the banner sits outside the `aria-modal` dialog so some screen readers may skip it; Delete on a visit that could not be written safely only resets in memory; no unit test for how `useReducedMotion` combines setting and system.
- **Tier 3 for Ares:** D-14 (analytics default and privacy wording), D-28 (widget toggle rules, HUD sizes, large-HUD trade-off at 1024×600), D-29 (what Delete keeps, deadline bounds, contrast change).

## M6 — hideout menu
**Round 1** (fresh Opus reviewer, screenshots in `docs/build/screens/M6/`): Readiness 3, Build quality 3, Vision fit 4.
- **Fixed after round 1:** two tests that could not fail (timer-continues pressed Space in demo and so paused it; STUDY proved nothing); focus lost after menu → screen → Esc (opener now carried across the hand-over); "MAPNot yet." accessible name; no highlight under the mouse on a locked label; tilted labels overlapping (click hit the neighbour); arrow keys dead after clicking the panel; a reduced-motion test that would pass a fade; pointer-position preconditions; labels moved to `content/copy`; overstated evidence.
- **Round 2** (same reviewer, at 275248f4): Readiness 4, Build quality 4, Vision fit 4. No blockers. Fixed afterwards: the menu's document-level arrow listener took keys from the dev panel's select; the panel scrolled 6 px at 1024×600 (gap-4, with an e2e at that size).
- **Open (not blocking):** the focus hand-over keeps its opener in module-level state in `Overlay.tsx` (works; could move into the store); MESSAGES leaves focus on the Menu button rather than the phone; the TV's controls sit outside the focus trap while a screen is open (by design, the TV is never covered; worth an ADR note).
- **Tier 3 for Ares:** D-30 (two reduced-motion paths, label angles, thin strike-through, no red on locked labels, 420 ms fade-in, PROFILE as an extra label).
