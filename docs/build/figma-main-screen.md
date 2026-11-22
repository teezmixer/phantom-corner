# Figma main screen: slot map (transcribed in Step 0)

Source: file `XtOZqCKhIr9PlwRCN8U6Pj`, frame `4:2521` "main screen", 1440×900.
Read on 2026-11-22 with `get_metadata`, `get_screenshot`, `get_design_context`.

**Figma variables: none.** `get_variable_defs` on the frame returned `{}`. Colour and type tokens
therefore come from the code (`tailwind.config.js`, `src/index.css`, `src/gate/gate.css`) — see D-01.

The visible layer is reference material (game screenshots / HUD rips). It is used **only** for position,
size and composition and is never exported. Positions below are frame coordinates (px from the top-left
of the 1440×900 frame).

## Widget slots — hidden group "Group 5" (`28:73`)

| Slot | Node | x | y | w | h | Corner (nearest) |
| --- | --- | --- | --- | --- | --- | --- |
| day / weather | 12:2 | 64 | 58 | 251 | 164 | tl |
| timer | 12:12 | 64 | 256 | 204 | 66 | tl |
| im (phone) | 28:68 | 44 | 342 | 65 | 60 | tl (hidden in Figma) |
| mission | 12:3 | 1104 | 58 | 272 | 101 | tr |
| todo list | 28:70 | 1104 | 188 | 272 | 101 | tr |
| level / hp | 12:15 | 64 | 675 | 158 | 116 | bl |
| menu / nav | 12:5 | 64 | 807 | 233 | 29 | bl |
| music player | 12:16 | 1163 | 683 | 213 | 50 | br |
| location | 12:4 | 1112 | 769 | 264 | 67 | br |

## Text labels — hidden group "Group 4" (`28:72`)

Weather / date (116,99), pomodoro timer (87,269), mission (1224,92), todo list (1220,215),
xp / level (87,775), music player (1243,674), Location (1199,786), buttons menu (75,823).

## Ares's own assets (exportable)

| Asset | Node | x | y | w | h | Note |
| --- | --- | --- | --- | --- | --- | --- |
| location-leblanc 1 | 64:30 | 911 | 636 | 498 | 224 | Already in repo as `src/assets/location-leblanc.png` (BUILT) |
| month 10 1 | 80:31 | 21 | 41 | 164 | 141 | Hand-drawn month numeral; export in M2 |

## Unclear provenance (ask Ares — D-02)

"Music Player" frame `12:187` (x 1266, y 549, ~100×87): vector `Star`, `CD`, `Note`. Not named as a game rip,
not listed as Ares's own. Not exported until Ares confirms.

## Reference layers (never export)

Background `4:2520`, `4:2522`; `12:127` (timer ref), `12:19` (button-hint ref), `12:18` "img108 1" (level ref),
`12:29` "image 1" / `12:31` "image 2" (date and mission refs), `12:234` (todo ref), `12:26`, `12:237`, `12:66`, `12:22`.
