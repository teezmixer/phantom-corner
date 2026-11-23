# Unlock schedule and messages (working draft)

You asked me to draft the unlock thresholds and messages without waiting for you, so these are the working copy. They live in one place each and every number and line is marked provisional: change `src/content/progression.ts` (levels, Knowledge) and `src/content/copy/index.ts` (`invitations`) and nothing else needs touching. (D-06, D-08, D-31, D-32.)

**How Knowledge is earned:** 1 per focused minute, +5 for a session that reaches zero, +10 once for the first mission. A 25-minute session is 30 Knowledge, so a focused hour is about 72 (two sessions and a bit). A level is the number of thresholds reached.

**Early game on purpose:** the first mission opens the map (level 2, 10 Knowledge); the first full 25-minute session brings level 3 (35 Knowledge) and Ryuji's message. After that a new place about every three to five hours of focus, with the last of the eight (Akechi) at about sixty hours. The four bonus places follow one per level after that (D-08: the spec leaves their rule to a community vote).

| Level | Knowledge needed | About how much focus | Place | Who | Their message (two lines, in their voice) |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | about 0.0 h | Café Leblanc | Sojiro & Morgana | — |
| 3 | 35 | about 0.5 h | School rooftop | Ryuji | Yo! Found a spot. / Come up to the roof when you're ready. Bring notes. Snacks too, if you're a good person. |
| 5 | 215 | about 3.0 h | Ann's place (sunny seat) | Ann | Got a sunny seat saved for you. / Crepes after, okay? Come find me. |
| 8 | 575 | about 8.0 h | Gallery light | Yusuke | I have found the ideal light. / Come. It will not wait forever. |
| 12 | 1080 | about 15.0 h | Library | Makoto | The library is quiet today. I reserved a table. / Phones on silent, please. See you there. |
| 16 | 1800 | about 25.0 h | Futaba's room | Futaba | ok so. you can come over. / don't be weird. also bring snacks. not optional. |
| 20 | 2880 | about 40.0 h | Garden | Haru | The garden is lovely this morning. Join me? / I'll have tea ready. No hurry at all. |
| 25 | 4320 | about 60.0 h | Jazz bar | Akechi | There's a seat at the bar. Late, as usual. / Don't keep me waiting too long. Patience isn't my strong suit. |
| 26 | 4610 | about 64.0 h | Rainy walk | (bonus) | — |
| 27 | 4900 | about 68.1 h | Subway ride home | (bonus) | — |
| 28 | 5190 | about 72.1 h | Velvet Room | (bonus) | — |
| 29 | 5480 | about 76.1 h | Mementos | (bonus) | — |

**Every level gives something**, even without an unlock (spec §3.4): see `levelRewards` in `src/content/copy/index.ts`.

**Testing it without the wait:** `?dev=true` has +50 Knowledge, Unlock all and Jump to location; nothing done there is saved.
