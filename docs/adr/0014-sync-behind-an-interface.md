# 0014 — Sync behind one interface, merged as plain data

- **Date:** 2026-11-23
- **Status:** accepted (spec §4.9)
- **Context:** Accounts are optional and local-first; the live backend does not exist yet (B-10). Sync must never be able to lose local progress, and its rules must be testable without a server.
- **Decision:**
  - **`SyncBackend`** (`src/sync/types.ts`) is the only thing the app knows about the server: request and verify a code, push and pull events, pull and push documents, export, delete. `FakeBackend` is the same contract in memory (it also enforces append-only and refuses a bad event, as the SQL does). A Supabase implementation replaces it in `backend()` when keys exist.
  - **The rules are pure** (`merge.ts`): events merge as a union by id, this device's order first; each of three documents (settings, mission, todos) takes the newer stamp, this device on a tie, and equal data is never pushed (so two agreeing devices do not keep re-stamping each other). `plan()` returns what to push and what to hold, as data.
  - **Events carry ids**, `<clientId>:<n>`, stamped in the reducer wrapper (D-24); saves from before ids get them on load. The server column is `text` for the same reason.
  - **Applying a sync** is one action, `SYNC_APPLY`, carrying a patch of only the event log and the synced fields. It is built through the same repair functions as a save read from storage, so a hostile document cannot set impossible values; it cannot touch the timer, the place or the story, and it brings no banners (history, not news).
  - **Applied to the state as it is after the round trip**, not as it was when the sync began (found in review): events are unioned with the current log, and a document is taken only if it has not changed since the sync began (`basis`); one the player changed meanwhile is kept and goes up next time. A document taken from the server keeps the time it came with (`adopted` in the state, read by the saver), so adopting an old copy never re-dates it to now and lets it overwrite a newer edit elsewhere. A change made during a sync queues one more.
  - **The analytics choice is not synced:** consent is per device.
  - **SQL:** event ids are unique per user (`primary key (user_id, id)`), every check is wrapped so a missing key fails it, the first mission's payload must be empty, payloads are small, document times cannot be ahead of the server's clock, an older document is ignored by a trigger, and everything Supabase grants by default is revoked before the few grants needed.
  - **Order:** pull, merge, then push. A failed pull writes nothing. The app never waits for the server.
  - **SQL is tested for real:** `src/sync/rls.test.ts` runs the migration and the four RLS tests (plus the constraints and the delete function) in PGlite, an in-process Postgres, with a minimal stand-in for Supabase's `auth` schema; the same cases are to be re-run against the live project.
  - **Loaded only when needed:** sync, sign-in and the fake are a lazy chunk fetched only when `?accounts=true`.
- **Rejected:** anonymous server users from the first visit (stores data for people who never agreed to anything); merging whole snapshots by one timestamp (loses a mission set on one device when settings changed on another); index-based event ids (they break when another device's events are merged in).
- **Consequences:** the calendar, story progress, name and visited places do not sync yet (D-35). Event times are the push time until events carry their own.
