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

### D-28 Settings rules I chose (provisional — Ares decides)
- **Widget toggles:** every widget except the **TV** (YouTube rule, spec §4.8) and the **button bar** (the way into the menu) can be hidden. Hiding the bar would strand mouse users; keyboard users could still press M.
- **HUD size** steps 0.85 / 1 / 1.15 / 1.3 (spec author's numbers) multiply the corner scaling; the TV's 200×200 inner player is unaffected.
- **Motion:** "Reduce motion" overrides the operating system for animation libraries and for CSS (`data-motion="reduced"` collapses all animation and transition durations). "Follow my system" is the default. There is no "full motion even if the OS says reduce" option, on purpose.
- **Analytics (D-14):** the switch exists and gates the Vercel scripts; **default ON** (provisional — you already had Analytics installed). Turning it off takes effect the next time the page loads, because a loaded script cannot be unloaded. Decide the real default and the privacy wording.
- **Export** downloads progress and preferences as JSON (schema 3, no UI state). **Delete** removes every `pc:` key including backups, then resets to the splash; the browser may still hold a copy in its own history/back-forward cache until reloaded. Both are one-click/two-press with no sign-in (accounts: M11).
- **Menu style** shows only "Hideout (text)" for now; the illustrated Student Ren style is M12.
- **Mission deadline** counts in whole minutes (rounded up), is optional, belongs to the mission, and disappears when the mission is done. The wording ("due in 2 h 15 min", "overdue by 45 min") is a draft (D-10).
- **Known trade-off:** at "Largest" HUD on the smallest window (1024×600) the free band between the todo box and the location sign is smaller than the 200×200 player, so the TV covers part of the location sign (the player is never the thing covered, spec §4.8). Pick a smaller HUD size on small screens, or tell me to cap the sizes by window height.

### D-29 Persistence and Settings rules added after the M5 review (provisional — Ares decides)
- **A bad preference never costs a save.** On load, settings are repaired (volumes clamped, unknown widget names dropped, missing fields defaulted), a single corrupt event or todo is dropped, and a mission deadline that is not a string is ignored. Only a structurally broken file is treated as unreadable. Alternative: reject the whole save and fall back to a backup (what it did before; it lost real progress over one bad value).
- **A visit where nothing changed is never saved.** Opening the page and leaving at the splash leaves no `pc:v1` behind, so a first-time visitor who bounces leaves nothing in their browser.
- **Delete my data** wipes every `pc:` key (including backups), cancels any pending save, then reloads to a true first visit. In demo and dev mode it only resets the demo and never touches the real save. **The analytics choice is the one thing kept** (`pc-optout`, deliberately not `pc:`-prefixed), otherwise deleting your data would switch tracking back on. Alternative: forget the choice too and ask again.
- **Deadlines** are accepted from one year in the past to five years ahead; anything else is ignored rather than stored (a mistyped year would otherwise show "due in 4,000 days"). Changing only a mission's deadline keeps a finished mission finished.
- **Overdue** is white text on a red slab, not red text (small red on black is 4.1:1, below spec §4.12).
- **A session ends even if its timer cannot be seen.** The completion check lives in an always-mounted clock, not in the Timer widget, so hiding the Timer (or the whole HUD) can no longer stop the "Time." screen from appearing.
- **Banners** render above every screen (z-index 58, below only the dev panel), and the "Ah, you're back." greeting is skipped on a recovered visit, which gets the recovery notice instead.

### D-30 Menu motion and behaviour placeholders (provisional — Ares decides)
- **Numbers:** snap 120 ms, wipe 200 ms, enter 420 ms, stagger 60 ms, hold 900 ms, travel 1.4 s, reduced cut 100 ms (spec §3.10; only the wipe is DECIDED, the rest are proposals). One source of truth in `src/styles/tokens.css`, mirrored in `src/motion/tokens.ts`, kept equal by a test.
- **Look:** the diagonal wipe's slant, the label angles (±1–2°) and the fly-in direction are plain placeholders until you draw the menu (spec §3.7 says "text labels fly in at angles").
- **Reduced motion:** the operating-system setting turns the wipe and the flying labels into one 100 ms hard cut (hidden for 100 ms, then shown, no fade). The in-app "Reduce motion" setting is stricter: it collapses every animation to about 0 ms (D-28). Alternative: make both use the 100 ms cut.
- **Highlight:** keyboard and mouse share one highlight (focus). A resting mouse never moves it; moving the mouse does. Not-yet labels (MAP before it unlocks) can be highlighted but do nothing and say "Not yet."
- **PROFILE** stays in the menu although spec §3.7 lists only STUDY, MAP, MESSAGES, SETTINGS, CLOSE.
- **D-30 additions (after the M6 review):** labels are tilted less (±1–1.5°) and spaced further apart so their boxes never overlap and a click always lands on the label under it. A focused not-yet label shows a teal outline, not the red fill (red means "available and selected"); say if you want red on unavailable items too. The strike-through on a not-yet label is thin in the ransom-note font and may need a heavier slash. The labels fade in over 420 ms while flying in (as the gate does); say if "never crossfades" should also rule that out.

### D-31 Progression, rewards, held unlocks and the calendar (provisional — Ares decides)
- **The level curve now runs to level 29** (L26 4610, L27 4900, L28 5190, L29 5480 Knowledge, the same pace as the spec's last steps). The spec's curve stops at 25, which would have made the four bonus locations unreachable. **Bonus rule (D-08, still yours):** one bonus location per level after the last canon unlock, in this order: Rainy walk 26, Subway 27, Velvet Room 28, Mementos 29.
- **Every level gives something** (`LEVEL_REWARDS` in `src/content/progression.ts`, wording in `content/copy`): level 2 the map, levels 3/5/8/12/16/20/25 and 26–29 a location (the notice is your verbatim line), and the others a new calendar stamp (levels 4, 10, 15, 19, 23), a study tip (6, 9, 13, 17, 21, 24) or a remark from Sojiro/Morgana (7, 11, 14, 18, 22). The tips are real advice; all the wording is draft (D-10). The remarks are announced in a banner only; adding them to a location's idle lines waits for the story module (M8).
- **Held unlocks:** `SHIPPED_LOCATIONS` lists the locations that exist for real. Today it lists all twelve (each has placeholder content), so nothing is held. If a level is reached before its location is listed, nothing unlocks and Morgana says "Someone's been asking about you. Not yet — but soon." Her IM arriving "the day it goes live" is the thread system (M8).
- **Calendar:** a month grid, Monday first, a Phosphor stamp icon on each studied day (placeholder look). A day counts as studied when a session finished, or was stopped after at least 5 minutes (the same rule as Knowledge). It uses the **local** date, and a session is stamped on the day it really ended, even if the tab was closed at the time. Each stamp keeps the design that was current when it was made, and a day keeps its first stamp. There is no counter, no streak and no "broken" state. The summary says "Today is stamped." only when today really was.
- **Old sessions are not stamped:** events carry no dates (D-24), so sessions from before this build cannot be placed on the calendar. Storage moves to schema 4 with an empty calendar; nothing else is lost.
- **Content:** every location now has three draft lines per group (the spec's minimum for the content test): about 120 new lines in each voice, all drafts for you to rewrite. The content test also checks ids, canon order, unlock order, images and alt text, track ids and thread ids; thread targets are checked from M8, when the threads exist.
- **D-31 additions (after the M7 review):** a session that crosses midnight is stamped on the day it **ended** (your call: or the day it started). The "Tip:" rewards have no speaker, unlike every other line (spec §3.8 gives every line a voice); say whose voice they should be. The demo calendar uses scattered days so it does not read as a streak. A session stopped after a long pause is stamped on the day Stop was pressed. Two draft lines were reworded for voice (Futaba, Akechi); all the rest are still drafts.

### D-32 Story, threads and phone rules I chose (provisional — Ares decides)
- **Ryuji's and Futaba's unlock messages:** the spec says you have already written them, but they are not in the handoff files, so every unlock message is a two-line DRAFT in voice. **Please send the real ones** and I will put them in `invitations` (`src/content/copy/index.ts`). The arrival exchange of each character is that place's own `arrive` lines (three drafts each).
- **One thread per character:** the invitation arrives when the place unlocks, then the thread waits for you to arrive, then the arrival exchange plays (once). Unlock and arrival are the same conversation, so the phone lists one entry per character.
- **A thread is listed only once it has started.** Nothing in the phone shows who unlocks next (spec §3.4: "nothing telegraphs what unlocks when"). The list therefore grows: Morgana, then characters as they unlock, what's new, feedback.
- **Question: the level widget's bar.** Spec §3.4 says there is never a progress bar toward the next unlock. The level widget shows a bar toward the next *level*, and unlocks sit on levels (3, 5, 8, 12, 16, 20, 25), so the bar telegraphs them. Keep it, hide it, or show it only between unlock levels?
- **Onboarding:** opens the phone on Morgana by itself on a first visit; it begins with Sojiro's arrival line, then Morgana asks the name, then your mission question (verbatim), then waits for a session. **S** skips it at any point (never while typing) and still grants the first Knowledge, so the map opens. It runs once, because its progress is saved; an existing player is not onboarded. The save prompt ("or its V1a stand-in") waits for accounts (M11).
- **What's new** is one thread that starts for a returning player at once, and for a new player after onboarding ends or is skipped. Its credit line ("Everyone who asked for this: thank you. It's yours.") is a draft. The version it is tied to is `RELEASE_VERSION` in `src/content/threads.ts`.
- **Feedback** stays on the device (B-08), is trimmed to 500 characters and never closes.
- **Lines around the room:** a place's **start** line shows as a banner when a session begins (a different one each session; not in demo); a first arrival at a place with no character thread (the four bonus places) shows its arrival line. **Idle lines** are written but have no place to show them: where they go is a layout decision.
- **Not built:** `reveal` steps (showing hidden widgets one by one) are understood and skipped; progressive reveal is a design decision.
- **Ordering:** Sojiro's "Ah, you're back." comes before any news from a session that ended while you were away.
- **D-32 additions (after the M8 review):** the bar question is now B-09 (`prog-unlock-im` is blocked on it). **Idle lines** now show: after 90 seconds idling in the room (timer idle, nothing open, not the demo) the place says one line, once until a session has started (`IDLE_AFTER_MS`, provisional). A **start line** shows on every session start; say if you would rather it were only the first of the day. "First visit" means *no save existed*: with storage blocked, or after a reset, a visit counts as a return (no onboarding, "Ah, you're back.", the release note); say if a blocked-storage visitor should be onboarded every time. The **S** key is shown on the in-thread "Skip (S)" button but not in the bottom bar's key hints. Setting the first mission shows the map in both a banner and Morgana's line (a little chatty; easy to drop either). Morgana's last onboarding line no longer promises a message (a short first session may not unlock anyone yet). **Content edits:** a thread the player has finished stays finished when its text changes in a later build (so your real Ryuji and Futaba messages will not replay for anyone who has already read the drafts); each release note is its own thread.

### D-33 Travel, the arriving sign and the map (provisional — Ares decides)
- **Travel timings:** red wipe 300 ms, title card held at least 800 ms, reveal wipe 300 ms: 1.4 s in all (spec range 1.2–1.6 s; the split is mine). With reduced motion the two wipes are 100 ms cuts and the card still holds 800 ms, because the next place loads inside it.
- **Look:** the wipe is a diagonal `clip-path`, the same slant as the menu's; the card is black with the place name in the display face and its register line under it; a thin red line moves under the card if images are slow (spec §3.10). The red, the slant and the line are placeholders until you draw travel.
- **The place changes when the reveal begins**, so the wipe uncovers the destination's room (not the one you left). Arrival messages and banners for that place appear then.
- **No images yet:** no location has scene art, so the card waits for nothing today; the machine and the 8-second give-up are tested with stand-in images.
- **The arriving sign:** on your first visit to a place (and the first time you enter the room) the sign comes in at 1.9× size, holds 900 ms once the room is in view, then settles into its corner. It grows up and to the left from its corner and stays below the TV player (never covering or crowding it). Returning to a place you have seen does not bring it in big again. Both numbers are mine.
- **The map:** a locked place shows "Place N" and "Locked", not its name and not the level that opens it (the old wording told you when each place unlocks, against spec §3.4). The map is still a plain list of markers: its layout is yours (decision `map-layout`).
- **The TV during travel:** it stays visible above the travel card, as it does over every screen (D-27); the music stopping on travel is the earlier rule (D-09).
- **D-33 additions (after the M9 review):** a session that finishes **during** a trip no longer cuts it off: the trip ends first, then the choice screen is shown (so the place you picked is not silently dropped). Travel is only to a place that is open, not where you already are, and not while a trip is going (the reducer enforces it, not only the map). When a trip ends, focus returns to the map button. **Questions for you:** (1) the music now stops when the place changes at the start of the reveal, about 1.1 s in, and plays through the red wipe and the card; D-09 says "travelling stops the music": should it stop when travel *starts*? (2) the map's "Place N" ordinals and its count of locked places tell a player how many places remain and which slot opens next, though not when; keep them, or show locked places without a number? (3) the card shows the place's name in the display face, not "the destination's sign, large" (your drawn signs are paused, D-21). (4) A reload in the second after the reveal but before arrival leaves you at the new place without the big sign for that first visit (the sign is not saved); fine, or save it?


### D-34 Hardening choices that are yours (provisional — Ares decides)
- **Share image and address:** the page has a title, description and share tags (`index.html`), but no `og:image`, `og:url` or canonical link: there is no original art yet and no final address. Send both when you have them.
- **The demo tag:** a small black box at the top centre reading "Demo · Fan project · How this was built", linking to the README section of that name on GitHub. Placement, look and wording are placeholders.
- **The crash card:** Sojiro's draft line and one "Reload" button on black. A reload restores the saved seat; it cannot help if the saved data itself is what crashes the page (not seen; no automatic repair).
- **The share card:** a 1200×630 PNG with the title, minutes, Knowledge, the place and the fan line, on black with a red edge. It never carries a name, mission or todo. The look is a placeholder; the file name is `phantom-corner-session.png`.
- **Privacy, About and Credits text** (drafts): saved in the browser only; the optional events name which place, how long and what level, never what you write; YouTube's player has its own policy; "not meant for children"; Cult UI credited under MIT; the background called a placeholder. Needs your wording and a contact address.
- **Analytics (D-14):** the named events (ten today; the two `save_prompt_*` events wait for accounts) fire only while the Settings switch is on and never in dev mode or the demo; the page-view script still loads in the demo when the switch is on. The default is still **on** (provisional); say if it should be off until the player chooses.
- **Timer announcements:** a screen reader hears "N minutes left" in five-minute steps, "Less than a minute left", and "Paused". The steps are my choice.
- **Controls get a 24 px target on screen** at any HUD scale; the look is unchanged but a few small controls now take a little more room.
- **Performance budgets** (120 kB initial JS gzipped, 800 kB first load, 250 kB per image with the B-05 screenshot exempt by name) are the spec's numbers; initial JS is at 115 kB, so there is little room left in the entry.
- **Not built:** the weekly check that each YouTube track still exists (needs a scheduled job); say if you want it.

### D-35 Accounts and sync choices that are yours (provisional — Ares decides)
- **Event ids:** every progress event now has an id, `<clientId>:<n>`, stamped in one place (D-24's plan). The server column is `text`, not the spec sketch's `uuid`, and `story_grant` joined the allowed kinds (it did not exist when the spec was written). Events carry no time (D-24): when pushed, `occurred_at` is the time of the push, so a long guest history all dates from its first sign-in.
- **What syncs:** the event log, and three documents (settings, mission, todos), newest stamp wins, as the spec says. **What does not:** your name, the calendar of studied days, which places you have visited, and how far each thread has got. So on a new device a returning player gets their Knowledge and level back but would start the story and the calendar again. Tell me if the calendar and story should sync too (a small change: two more documents and their stamps).
- **Developer grants** never sync; the server refuses them.
- **The save prompt** is a separate thread, "Save progress", from Morgana: her verbatim line, then Yes (opens Settings) and Not now, then one draft closing line. It appears on arrival at Ryuji's place only when accounts are on and the player is signed out. The wording of the buttons and the closing line are drafts.
- **Sign in** is the first sync: the guest's whole history goes up at once, and the server's comes down. Signing out keeps everything on the device. Deleting the account removes what is stored online and keeps what is on the device; a separate Delete my data removes that.
- **Sync down** shows as a small red dot in the bottom-left corner of the window plus a sentence in Settings; the dot's look and place are placeholders.
- **The panel's words** (practice-mode note, "Send code", "Sign in", "Sync now" and so on) are plain drafts, not in a character's voice.
- **Not synced on purpose:** your analytics choice (consent is per device).
- **The save prompt** also appears for a player who reached Ryuji's place before accounts were switched on, the first time they are on, wherever they are, rather than only on a fresh arrival.
- **Practice mode:** until the live backend exists the account lives in memory, so a reload ends the practice session; the code is always 123456.

### D-36 M12 choices that are yours (provisional — Ares decides)
- **Mission-complete moment:** a banner "Mission complete." and a small rising two-note sound, clearly quieter than the session fanfare (spec §3.9: one loud moment). Wording and sound are drafts.
- **The break:** five minutes by default; you can pick 5, 10 or 15 while it runs (choosing restarts it from now); "Skip the rest" returns to the choice; when it runs out there is a soft two-note bell and "Break's over. Back to it when you're ready." Skipping makes no sound. All provisional, in a neutral voice, not Sojiro's or Morgana's.
- **Day and night:** day is 06:00 to 19:00 on the player's clock, night otherwise, re-checked each minute. No night art exists, so the variant is carried as data, shown in the placeholder scenes (a darker block and the word "night") and used for a place's `scene.night` once it has one. LeBlanc's background is untouched (BUILT), so LeBlanc looks the same at night until you draw it.
- **Illustrated menu:** a slot for the drawn Student Ren beside the same six labels, and a placeholder Morgana (a Phosphor cat in a box) that rises from the bottom of the slot in 600 ms. Both are stand-ins for your art; the rise is my guess at the motion.
- **Sign fold:** as the big sign settles it squashes and rebounds for 500 ms, like a crumpling paper ball, once. The spec's "folding like a paper ball into the corner" would be a real drawn fold; this is a placeholder.
- **Profile:** "member since" comes from a new `createdAt` on the save, so it is blank for players whose save is older than this build until they next play (then it says the date of that save, not their true first visit). The roster is the places and people unlocked.
- **Community (behind `?community=true`, made-up numbers, B-11):** presence is 0 to 8 depending on the place and the hour, hidden at 0, and says "practice numbers"; the vote lists the bonus places that are still closed, by name (so it does show names the map otherwise hides for locked places), with invented starting counts; it does not decide the order places open in (that stays the data rule, D-08) and it is gone on reload. Say whether the vote should name them, whether it should decide anything, and what presence may collect.
- **Copy the card** is offered only where the browser can copy images.
