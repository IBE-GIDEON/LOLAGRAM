-- LOLAGRAM signup repair
-- Run this once in Supabase SQL Editor if signup shows:
-- "Database error creating new user"
--
-- Important: LOLAGRAM creates public.users profiles inside /api/auth/signup.
-- The old Supabase Auth trigger can block auth signups before the app route can
-- save the profile, so this patch disables that trigger.

create extension if not exists "pgcrypto";

do $$
begin
  create type public.account_type as enum ('buyer', 'seller', 'both');
exception
  when duplicate_object then null;
end;
$$;

-- Repair existing public profiles that were created with blank email/phone/name.
update public.users u
set
  email = coalesce(
    nullif(btrim(u.email), ''),
    nullif(btrim(au.email), ''),
    concat(u.id::text, '@missing.lolagram.local')
  ),
  phone = coalesce(
    nullif(btrim(u.phone), ''),
    nullif(btrim(au.raw_user_meta_data ->> 'phone'), ''),
    nullif(btrim(au.phone), ''),
    concat('missing-', u.id::text)
  ),
  full_name = coalesce(
    nullif(btrim(u.full_name), ''),
    nullif(btrim(au.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(au.email, ''), '@', 1), ''),
    'LOLAGRAM User'
  )
from auth.users au
where au.id = u.id
  and (
    u.email is null
    or btrim(u.email) = ''
    or u.phone is null
    or btrim(u.phone) = ''
    or u.full_name is null
    or btrim(u.full_name) = ''
  );

-- Keep the function available for old/manual maintenance, but do not attach it
-- to auth.users. The app signup API is now the source of truth for profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_email text;
  profile_phone text;
  profile_name text;
  profile_account_type public.account_type;
begin
  profile_email := coalesce(
    nullif(btrim(new.email), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'email'), ''),
    concat(new.id::text, '@missing.lolagram.local')
  );

  profile_phone := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(btrim(new.phone), ''),
    concat('missing-', new.id::text)
  );

  profile_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(profile_email, '@', 1), ''),
    'LOLAGRAM User'
  );

  begin
    profile_account_type := coalesce(
      (new.raw_user_meta_data ->> 'account_type')::public.account_type,
      'buyer'
    );
  exception
    when invalid_text_representation then
      profile_account_type := 'buyer';
  end;

  insert into public.users (id, email, phone, full_name, account_type)
  values (
    new.id,
    profile_email,
    profile_phone,
    profile_name,
    profile_account_type
  )
  on conflict (id) do update
  set
    email = excluded.email,
    phone = excluded.phone,
    full_name = excluded.full_name,
    account_type = excluded.account_type;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

select id, email, phone, full_name, created_at
from public.users
order by created_at desc;
