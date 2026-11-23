// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * The row-level-security tests (spec §4.9) and the check constraints, run against a real Postgres in this process
 * (PGlite). Supabase's own pieces are stood in for by the smallest thing the migration needs: an `auth.users` table,
 * `auth.uid()` reading the signed-in user from a setting, and the `anon` and `authenticated` roles.
 * Re-run the same migration and these cases against the live project once it exists (B-10).
 */
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let db: PGlite;

/** Run as a signed-in user, as the `authenticated` role; or as `anon` with no user. */
async function as<T>(who: string | null, run: () => Promise<T>): Promise<T> {
  await db.exec(who ? `set role authenticated; select set_config('request.jwt.claim.sub', '${who}', false);` : `set role anon; select set_config('request.jwt.claim.sub', '', false);`);
  try { return await run(); } finally { await db.exec("reset role"); }
}
const event = (id: string, user: string | null, extra = "") => db.query(`insert into public.progress_events (id, ${user ? "user_id, " : ""}kind, payload, occurred_at${extra ? ", " + extra.split("|")[0] : ""}) values ($1, ${user ? `'${user}', ` : ""}'mission_first_set', '{}', now())`, [id]);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role anon; create role authenticated;
    grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
    grant usage on schema public to anon, authenticated;
    -- Supabase's own defaults: every new table in public is granted to both roles. The migration must take this back.
    alter default privileges in schema public grant all on tables to anon, authenticated;
    insert into auth.users values ('${A}'), ('${B}');
  `);
  await db.exec(readFileSync(path.resolve(import.meta.dirname, "../../supabase/migrations/20261123000000_accounts_and_sync.sql"), "utf8"));
});

describe("row-level security: the four tests the spec asks for", () => {
  it("1. user B cannot read user A's events", async () => {
    await as(A, () => event("a:1", A));
    const rows = await as(B, () => db.query("select id from public.progress_events"));
    expect(rows.rows).toEqual([]);
    const own = await as(A, () => db.query("select id from public.progress_events"));
    expect(own.rows).toEqual([{ id: "a:1" }]);
  });

  it("2. a signed-out client reads nothing (and cannot write)", async () => {
    await expect(as(null, () => db.query("select id from public.progress_events"))).rejects.toThrow(/permission denied/);
    await expect(as(null, () => db.query("select * from public.user_docs"))).rejects.toThrow(/permission denied/);
    await expect(as(null, () => event("anon:1", A))).rejects.toThrow(/permission denied/);
  });

  it("3. an insert carrying someone else's user_id is rejected", async () => {
    await expect(as(B, () => event("b:forged", A))).rejects.toThrow(/row-level security/);
    const check = await db.query("select count(*)::int as n from public.progress_events where id = 'b:forged'");
    expect(check.rows).toEqual([{ n: 0 }]);
  });

  it("3b. two accounts may use the same event id (one device, two sign-ins), and neither sees the other's", async () => {
    await as(A, () => event("shared:1", A));
    await as(B, () => event("shared:1", B));
    expect((await as(A, () => db.query("select user_id from public.progress_events where id = 'shared:1'"))).rows).toEqual([{ user_id: A }]);
    expect((await as(B, () => db.query("select user_id from public.progress_events where id = 'shared:1'"))).rows).toEqual([{ user_id: B }]);
  });

  it("4. an update to an event is rejected, and so is a delete (append-only from the client)", async () => {
    await expect(as(A, () => db.query("update public.progress_events set kind = 'session' where id = 'a:1'"))).rejects.toThrow(/permission denied/);
    await expect(as(A, () => db.query("delete from public.progress_events where id = 'a:1'"))).rejects.toThrow(/permission denied/);
    const still = await db.query("select kind from public.progress_events where id = 'a:1'");
    expect(still.rows).toEqual([{ kind: "mission_first_set" }]);
  });
});

describe("the client can only append: no truncate either", () => {
  it("refuses truncate, which row-level security does not cover", async () => {
    await expect(as(A, () => db.query("truncate public.progress_events"))).rejects.toThrow(/permission denied/);
    await expect(as(null, () => db.query("truncate public.progress_events"))).rejects.toThrow(/permission denied/);
  });
});

describe("the other tables follow the same rule", () => {
  it("documents and profiles are readable and writable only by their owner", async () => {
    await as(A, () => db.query(`insert into public.user_docs (doc, data, updated_at) values ('mission', '{"text":"x"}', now())`));
    await as(A, () => db.query(`update public.user_docs set data = '{"text":"y"}' where doc = 'mission'`));
    expect((await as(B, () => db.query("select * from public.user_docs"))).rows).toEqual([]);
    const stolen = await as(B, () => db.query(`update public.user_docs set data = '{"text":"mine"}' where user_id = '${A}'`));
    expect(stolen.affectedRows).toBe(0); // the row is invisible to B, so nothing is updated
    await expect(as(B, () => db.query(`insert into public.user_docs (user_id, doc, data, updated_at) values ('${A}', 'todos', '{}', now())`))).rejects.toThrow(/row-level security/);
    await as(A, () => db.query(`insert into public.profiles (id, display_name) values ('${A}', 'Ren')`));
    expect((await as(B, () => db.query("select * from public.profiles"))).rows).toEqual([]);
  });

  it("an older copy of a document does not replace a newer one, and a clock far ahead is refused", async () => {
    await as(A, () => db.query(`insert into public.user_docs (doc, data, updated_at) values ('todos', '{"v":"new"}', now())`));
    await as(A, () => db.query(`update public.user_docs set data = '{"v":"old"}', updated_at = now() - interval '1 day' where doc = 'todos'`));
    expect((await db.query("select data from public.user_docs where doc = 'todos'")).rows).toEqual([{ data: { v: "new" } }]);
    await expect(as(A, () => db.query(`update public.user_docs set updated_at = now() + interval '1 year' where doc = 'todos'`))).rejects.toThrow(/updated_at/);
  });

  it("only the three documents are allowed", async () => {
    await expect(as(B, () => db.query(`insert into public.user_docs (doc, data, updated_at) values ('secrets', '{}', now())`))).rejects.toThrow(/check constraint/);
  });
});

describe("a broken client cannot write nonsense", () => {
  const session = (id: string, payload: object, at = "now()") => as(B, () => db.query(`insert into public.progress_events (id, kind, payload, occurred_at) values ('${id}', 'session', '${JSON.stringify(payload)}', ${at})`));
  it("accepts a real session", async () => {
    await session("b:ok", { plannedMs: 1_500_000, focusedMs: 1_500_000, outcome: "completed" });
  });
  it("refuses more than four hours of focus, focus longer than planned, and an unknown outcome", async () => {
    await expect(session("b:long", { plannedMs: 86_400_000, focusedMs: 5 * 3_600_000, outcome: "completed" })).rejects.toThrow(/session_payload/);
    await expect(session("b:over", { plannedMs: 60_000, focusedMs: 600_000, outcome: "completed" })).rejects.toThrow(/session_payload/);
    await expect(session("b:odd", { plannedMs: 60_000, focusedMs: 60_000, outcome: "won" })).rejects.toThrow(/session_payload/);
    await expect(session("b:neg", { plannedMs: 60_000, focusedMs: -5, outcome: "stopped" })).rejects.toThrow(/session_payload/);
  });
  it("refuses a session or grant with no payload (a missing key must not slip past a check), free text in the first mission, and a big payload", async () => {
    await expect(session("b:empty", {})).rejects.toThrow(/session_payload/);
    await expect(as(B, () => db.query(`insert into public.progress_events (id, kind, payload, occurred_at) values ('b:g', 'story_grant', '{}', now())`))).rejects.toThrow(/grant_payload/);
    await expect(as(B, () => db.query(`insert into public.progress_events (id, kind, payload, occurred_at) values ('b:m', 'mission_first_set', '{"text":"anything"}', now())`))).rejects.toThrow(/mission_payload/);
    const big = JSON.stringify({ plannedMs: 60_000, focusedMs: 60_000, outcome: "stopped", pad: "x".repeat(2000) });
    await expect(as(B, () => db.query(`insert into public.progress_events (id, kind, payload, occurred_at) values ('b:big', 'session', '${big}', now())`))).rejects.toThrow(/payload_size/);
  });
  it("refuses an event from thirty years ago", async () => {
    await expect(session("b:old", { plannedMs: 60_000, focusedMs: 60_000, outcome: "stopped" }, "now() - interval '30 years'")).rejects.toThrow(/not_ancient/);
  });
  it("refuses an event from the future, and a developer grant", async () => {
    await expect(session("b:future", { plannedMs: 60_000, focusedMs: 60_000, outcome: "completed" }, "now() + interval '1 day'")).rejects.toThrow(/not_in_future/);
    await expect(as(B, () => db.query(`insert into public.progress_events (id, kind, payload, occurred_at) values ('b:dev', 'dev_grant', '{}', now())`))).rejects.toThrow(/check constraint/);
  });
});

describe("account delete", () => {
  it("removes the caller's account and everything of theirs, and no one else's", async () => {
    await as(B, () => db.query("select public.delete_my_account()"));
    expect((await db.query(`select count(*)::int as n from auth.users where id = '${B}'`)).rows).toEqual([{ n: 0 }]);
    expect((await db.query(`select count(*)::int as n from public.progress_events where user_id = '${B}'`)).rows).toEqual([{ n: 0 }]);
    expect((await db.query(`select count(*)::int as n from public.progress_events where user_id = '${A}'`)).rows).toEqual([{ n: 2 }]); // a:1 and shared:1
    await expect(as(null, () => db.query("select public.delete_my_account()"))).rejects.toThrow(/permission denied/);
  });
});
