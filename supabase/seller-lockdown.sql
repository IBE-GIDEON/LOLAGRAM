-- Seller lock-down: make "only we can open a store" a database rule, not just
-- a hidden button.
--
-- NEXT_PUBLIC_SELLER_EMAILS hides the seller UI, but it ships inside the client
-- bundle and RLS still lets any signed-in user insert their own vendor_profiles
-- row straight through the API. This closes that.
--
-- Safe to re-run. It only changes INSERT: existing stores keep their update
-- policy, so nobody currently selling is affected.

-- 1. Who is allowed to open a store.
create table if not exists public.seller_allowlist (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

alter table public.seller_allowlist enable row level security;
-- Deliberately no policies: only the service role can read or write this table,
-- so a buyer cannot list it or add themselves.

-- >>> EDIT THIS: it must match the email you sign in with, lowercase. <<<
insert into public.seller_allowlist (email, note)
values ('shytersnicks@gmail.com', 'founder')
on conflict (email) do nothing;

-- 2. The check runs as the function owner, not as the caller, so the policy can
--    read the allowlist even though the table itself is locked down.
create or replace function public.is_allowlisted_seller()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.seller_allowlist a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_allowlisted_seller() from public;
grant execute on function public.is_allowlisted_seller() to authenticated;

-- 3. Swap the open insert policy for the allowlisted one.
drop policy if exists "Sellers can insert their own vendor profile" on public.vendor_profiles;
drop policy if exists "Allowlisted sellers can insert their own vendor profile" on public.vendor_profiles;

create policy "Allowlisted sellers can insert their own vendor profile"
on public.vendor_profiles for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.is_allowlisted_seller()
);

-- To reopen the marketplace later, drop this policy and recreate the original:
--
--   drop policy "Allowlisted sellers can insert their own vendor profile"
--     on public.vendor_profiles;
--   create policy "Sellers can insert their own vendor profile"
--     on public.vendor_profiles for insert
--     to authenticated
--     with check (auth.uid() = user_id);
