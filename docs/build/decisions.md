# Decisions for Ares (Tier 3)

Each item: question · options · spec recommendation · what the placeholder does now · where it lives.
Nothing here is applied without Ares. Provisional values are tagged `provisional` in their content file.

## Infrastructure / process

### D-01 Figma has no variables — where do tokens come from?
- **Question:** The main-screen frame (`4:2521`) has no Figma variables (`get_variable_defs` → `{}`), so there is nothing to transcribe.
- **Options:** (a) treat the existing code tokens (`tailwind.config.js` colours, `src/index.css` font tokens, `src/gate/gate.css`) as the design system; (b) Ares defines variables in Figma and M1 re-transcribes them.
- **Spec:** n/a. **Placeholder now:** (a) — M1 consolidates the code tokens into `styles/tokens.css` + `DESIGN.md`, marked "from code, pending Figma variables".

### D-02 Music-player vector in the frame — RESOLVED 2026-11-22
- **Ares:** not his; an internet placeholder. Replace with interactive assets from our libraries.
- **Now:** never exported. The music player is built from Phosphor icons (ui-ux-pro-max catalogue) and Cult UI behaviour, styled only with tokens.

### D-03 Local-only files kept out of the public repo
- `handoff/` was already excluded in `.git/info/exclude`. Step 0 also excluded the root duplicates `/BUILD-PROMPT.md`, `/phantom-corner-spec.md` (byte-identical to `handoff/`) and `/DESIGN.md-spec.md` (third-party format spec, licence unchecked) the same way, rather than deleting or committing them.
- **Options:** keep as is / delete the root duplicates / move `DESIGN.md-spec.md` into `handoff/`.

### D-04 Tailwind version: spec vs pre-flight
- Spec §4.2 marks "Tailwind 3 pinned" DECIDED; pre-flight P2 chose Tailwind v4 + shadcn so Cult UI works. Pre-flight is the later decision and is followed; recorded so the spec can be updated.

## Product

### D-05 `tv-placement` — where the visible TV player sits
- Figma has a 213×50 "music player" slot, too small for the ≥200×200 rule (§4.8). **Placeholder:** a neutral 200×200 visible block outside the scaled corner groups (§4.4), bottom-right above the sign. `// DECISION: tv-placement`.

### D-06 Knowledge numbers and level curve (§3.4)
- Spec proposes 1/min, +5 completion, ≥5 min cut-short, +10 first mission, L2=10, L3=35, then L5/8/12/16/20/25. **Placeholder:** exactly those, in `src/content/progression.ts`, tagged provisional.

### D-07 Which place stands for each character (§3.3, spec D9)
- Spec list: rooftop (Ryuji), café terrace (Ann), atelier (Yusuke), library (Makoto), Futaba's room, rooftop garden (Haru), jazz club (Akechi). **Placeholder:** used as manifest names/registers, provisional.

### D-08 Bonus-location unlock rule
- No rule in the spec (vote, later). **Placeholder (provisional):** one bonus location per level after L25, or all via dev panel.

### D-09 Placeholder track IDs
- Spec names no IDs; rights-holder uploads only; embeddability unverified. **Placeholder:** empty playlists with the "unavailable" state until Ares supplies IDs (M4 will log any IDs tried and whether they embed).

### D-10 "Not yet" menu copy and the level-up gifts
- Spec gives no exact copy. **Placeholder:** draft strings in content files, marked draft.

### D-11 Phone layout
- Out of scope this build (design decision; spec D10 recommends desktop only through 90%). The BUILT mobile gate stays.

## Assets

### D-12 Borrowed assets (pre-flight P5: leave untouched)
- `public/fonts/` (commercial fonts, spec CHANGE-5 / D1) and the game-screenshot background (CHANGE-3 / D2). Untouched this run.

### D-13 Real interface sounds
- Placeholder tones are synthesised with Web Audio (select, menu open/close, travel, session start/complete, door bell). Real royalty-free files with per-file licence pending.

## Public-facing

### D-14 Analytics policy (spec D14) and licence (spec D11)
- Analytics events are built behind the settings switch (default to be decided; placeholder: on, with the switch). No LICENSE file is added; licence choice is Ares's.

## Visual identity

### D-15 Two token values disagree between the old Figma export and the live gate
- Recovered export (commits 4129f5e/df6a002): `--redbright` rgb(254 0 0), `--greymid` rgb(123 123 123).
- Live gate (`gate.css`, BUILT) and spec §4.12 contrast figures: `--redbright` rgb(221 5 7), `--greymid` rgb(97 96 101).
- **Placeholder now:** the live values (no visible change). In `src/styles/tokens.css`, marked `DECISION: D-15`. Ares picks one.

### D-16 Token families whose fonts are not loaded
- `--display-label` (Bubblegum Superstar) and `--hud-timer` (Earwig Factory) name faces that only exist in `public/fonts/` (untouched per P5) and have no `@font-face`. They fall back to Expose/Impact. Wiring them would add commercial fonts (spec CHANGE-5 / D1), so it waits for Ares.

### D-17 Placeholder grey
- The BUILT HUD placeholders used `#d9d9d9`, which is not a token. Replaced with `--greylight` (rgb 207 207 207), the nearest token. `DECISION: token-missing-placeholder-grey`.

### D-18 Corner radius token
- No radius token exists in the export. shadcn needs `--radius`. **Placeholder:** `0px` in `src/styles/shadcn.css` (`DECISION: token-missing-radius`).

### D-19 shadcn role mapping
- shadcn roles mapped onto tokens in `src/styles/shadcn.css`: background/card black, foreground white, primary redbright, accent and ring accentteal (spec §3.7 "red selection, teal accent", §4.12 teal focus ring), muted greydark/greylight, border greymid, destructive redmid. Ares may remap any role.

## Layout

### D-20 Slot positions: BUILT offsets vs Figma "Group 5"
- `src/hud/slots.ts` uses the BUILT MainScreen offsets (e.g. left 39 px; mission top 43, right 46). Figma's hidden Group 5 slots sit at 64 px from the edges, and its location slot is 264×67 while the BUILT sign is 484×218. `phone` (no BUILT position) uses Figma (44, 342, 65×60).
- **Ares picks:** keep BUILT offsets, or snap to the Figma slots. Either is a data change in one file.

### D-21 No hand-drawn assets for now — RESOLVED (Ares's instruction, 2026-11-22)
- **Ares:** only Café Leblanc is ready and the dates are in progress; do not use them now. Use assets from Cult UI and ui-ux-pro-max that best represent each widget's function.
- **Now:** the Leblanc sign and month numeral are not rendered anywhere. Widgets: timer → Cult UI timer pieces + Phosphor; date/clock/Knowledge/level → Cult UI `rolling-number` + Phosphor; todo → Cult UI `sortable-list` behaviour; bottom bar → Cult UI `dock`; phone → Cult UI `side-panel`; Knowledge bar → Cult UI `halo-progress`; location → Phosphor map pin + name. Files stay in `src/assets/` unused.
- **To restore:** re-add `sign` to `content/locations/leblanc/manifest.ts` and render it in `widgets/Location`.

### D-22 Rules the review surfaced (provisional — Ares decides)
- **Heading face:** Doctor Punk's H is a hairline and reads as missing in headings ("Hideout" → "ideout"). UI headings, menu labels and the location sign use Expose (`font-display-hero`) instead. The gate keeps its own per-letter mix (BUILT). Which face(s) the app uses is yours; Bubblegum Superstar and Earwig Factory (D-16) still have no loaded font.
- **Travel mid-session:** allowed, and it never stops a running timer; a finished timer is acknowledged. Alternative: block travel while a session runs.
- **Reset all data:** two presses (first arms for 4 s) instead of a confirm dialog, because "Are you sure?" is on the banned-phrase list. Alternative: in-voice confirm line from Morgana.
- **A finished timer jumps whatever screen is open to the session-end choice.** Alternative: wait until the user closes the screen.
- **Timer icon** is static while a session runs (upstream spins it) to keep the room calm.
- **Overlay vs TV:** screens leave a gutter on the right so the TV sits above the scrim and is never covered; the TV is not inert while a screen is open. Placement is still D-05.

### D-23 Slot sizes grown to fit their content
- `timer` 204 → 260 px wide (digits + controls overflowed the Figma 204); `todo` 101 → 120 px tall (shows two items). Positions unchanged; still data in `src/hud/slots.ts`. At 1024×600 the todo bottom (198 px) still clears the TV (top 200 px).

### D-24 Event ids and timestamps before sync (engineering note for M11, Ares may weigh in)
- Stored events are `{kind, …}` without an `id` or `at`, and todo ids are numbers, unlike spec §4.7 (`id: string`) and §4.9 (sync merges events by `id`). **Plan:** M11 adds `id` and `at` through a schema migration 1→2 (`id = "<clientId>:<index>"` for existing events), the first real use of the migration path. Alternative: add them now. Cost now: every event creator needs a clock and an id source (the reducer is deliberately pure).
- No heartbeat fallback for browsers without Web Locks (ADR 0006); all evergreen browsers have them.

### D-09 (updated) / D-26 Placeholder TV playlist — Ares picks the real music
- The spec names no video ids. **Placeholder now:** three rights-holder uploads (label-generated "Lyn – Topic" tracks of "Beneath the Mask": plain, rain, instrumental), shared by every location, in one file `src/content/tracks.ts`. Embeddability was checked with YouTube's oEmbed endpoint on 2026-11-22 (HTTP 200 for all three). Candidates also seen: an official "Winter Version" upload on SEGA Asia's channel (`YIft4h8S4R8`).
- **Ares decides:** which tracks, per location (spec §3.3 sound notes: café murmur/jazz for LeBlanc, wind for Ryuji's rooftop, …), and whether a rights-holder upload is acceptable at all for the public launch (spec §8.2).
- **Rule I applied (provisional):** travelling stops the music; the user presses play again, so playback only ever starts from a user action. Alternative: continue into the new location's playlist.

### D-25 Placeholder sound design and default volumes
- Every interface sound is a short synthesised tone (select, menu open/close, travel, session start, session complete, door bell) and every ambience is filtered noise — stand-ins for real, licensed sounds (D-13). Default bus volumes (music 50 %, ambience 35 %, interface 70 %) and the "halve interface sounds while a session runs" rule (spec §3.9) are provisional. `src/audio/sfx.ts`, `src/audio/ambience.ts`, `src/content/copy`.

### D-27 TV above the screens instead of pausing under them; other TV rules I chose (Ares to confirm)
- **Spec §4.8 says** a full-screen layer that would cover the TV (menu, map, summary, travel) *pauses it first and resumes after*. **I did instead:** the TV sits above every screen's scrim and every screen leaves it a gutter, so it is never covered and keeps playing. This also means the music does not stop when you open the menu. Alternative: pause under screens as the spec says. Logged in ADR 0007.
- **Next/Previous while paused or off start playback** (they are a user action, like Play).
- **Keyboard access to the TV while a screen is open:** a screen traps focus inside itself, so the TV's buttons can be reached by mouse but not by Tab until the screen closes.
- **YouTube's default player chrome stays on the video** (spec §4.8), so there are two sets of controls (ours beside the video, YouTube's on it). If you prefer only ours, that needs the owner's sign-off against the "do not alter the player" rule.
- **Privacy / About pages say nothing about YouTube yet.** Embedding YouTube means YouTube may set cookies/collect data even with the privacy-enhanced host; the wording belongs in your voice (D-14).
