-- GLOWGRAM keep-alive
-- Supabase Free projects pause after ~7 days with no activity. /api/keep-alive
-- touches this table on a schedule so the project always looks active.
--
-- Run once in the Supabase SQL editor.

create table if not exists public.keep_alive (
  id smallint primary key default 1,
  pinged_at timestamptz not null default now(),
  constraint keep_alive_single_row check (id = 1)
);

insert into public.keep_alive (id, pinged_at)
values (1, now())
on conflict (id) do nothing;

-- RLS on with no policies: buyers and sellers can never read or write this
-- table. Only the service role (which bypasses RLS) touches it.
alter table public.keep_alive enable row level security;
