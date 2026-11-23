-- Phantom Corner accounts and sync (spec §4.9). The browser holds only the public key, so these policies ARE the security
-- boundary. Run by `supabase db push`; checked locally by src/sync/rls.test.ts (the four row-level-security tests and the
-- check constraints) against an in-process Postgres, and to be re-run against the real project when credentials exist (B-10).

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) between 1 and 24),
  created_at timestamptz not null default now()
);

-- Events are named on the device: "<clientId>:<n>" (D-24), so the id is text, not a uuid as the spec sketch had it.
create table public.progress_events (
  id text primary key check (char_length(id) between 3 and 100),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  -- dev_grant is a developer-panel event and never syncs. story_grant joined the log after the spec's sketch (M8).
  kind text not null check (kind in ('mission_first_set', 'session', 'story_grant')),
  payload jsonb not null default '{}',
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  -- A broken client cannot write nonsense: a session is at most four hours of focus, no longer than it was planned for.
  constraint session_payload check (
    kind <> 'session' or (
      (payload ->> 'focusedMs') ~ '^[0-9]+$'
      and (payload ->> 'plannedMs') ~ '^[0-9]+$'
      and (payload ->> 'focusedMs')::numeric <= 4 * 60 * 60 * 1000
      and (payload ->> 'plannedMs')::numeric between 1 and 24 * 60 * 60 * 1000
      and (payload ->> 'focusedMs')::numeric <= (payload ->> 'plannedMs')::numeric + 1000
      and payload ->> 'outcome' in ('completed', 'stopped')
    )
  ),
  constraint grant_payload check (
    kind <> 'story_grant' or (
      char_length(payload ->> 'key') between 1 and 100
      and (payload ->> 'knowledge') ~ '^[0-9]+$'
      and (payload ->> 'knowledge')::numeric <= 1000
    )
  ),
  -- Not in the future (a minute of clock slack).
  constraint not_in_future check (occurred_at <= now() + interval '1 minute')
);
create index progress_events_user_time on public.progress_events (user_id, occurred_at);

create table public.user_docs (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  doc text not null check (doc in ('settings', 'mission', 'todos')),
  data jsonb not null check (pg_column_size(data) < 65536),
  updated_at timestamptz not null,
  primary key (user_id, doc)
);

alter table public.profiles enable row level security;
alter table public.progress_events enable row level security;
alter table public.user_docs enable row level security;

-- Nothing is readable or writable by the anonymous role: no grant, and no policy for it.
revoke all on public.profiles, public.progress_events, public.user_docs from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.progress_events to authenticated; -- append-only: no update or delete from the client
grant select, insert, update on public.user_docs to authenticated;

create policy "read own events" on public.progress_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "append own events" on public.progress_events
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "create own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "change own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "read own docs" on public.user_docs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "create own docs" on public.user_docs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "change own docs" on public.user_docs
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Account delete (spec §4.9): the client cannot delete from auth.users, so this runs with the owner's rights, only for the
-- caller's own id. Everything of theirs goes with the user (on delete cascade).
create function public.delete_my_account() returns void
language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
