# Decisions for Ares (Tier 3)

Each item: question · options · spec recommendation · what the placeholder does now · where it lives.
Nothing here is applied without Ares. Provisional values are tagged `provisional` in their content file.

## Infrastructure / process

### D-01 Figma has no variables — where do tokens come from?
- **Question:** The main-screen frame (`4:2521`) has no Figma variables (`get_variable_defs` → `{}`), so there is nothing to transcribe.
- **Options:** (a) treat the existing code tokens (`tailwind.config.js` colours, `src/index.css` font tokens, `src/gate/gate.css`) as the design system; (b) Ares defines variables in Figma and M1 re-transcribes them.
- **Spec:** n/a. **Placeholder now:** (a) — M1 consolidates the code tokens into `styles/tokens.css` + `DESIGN.md`, marked "from code, pending Figma variables".

### D-02 Music-player vector in the frame — Ares's own?
- **Question:** Frame `12:187` "Music Player" (Star, CD, Note vectors) is neither named as a game rip nor listed as Ares's asset.
- **Options:** export and use it / treat as reference only. **Placeholder now:** not exported; the TV slot uses a token block.

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
