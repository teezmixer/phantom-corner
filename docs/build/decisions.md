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
