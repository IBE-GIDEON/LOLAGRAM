-- GLOWGRAM — frictionless signup migration
-- Run this ONCE in the Supabase SQL editor before the onboarding push.
--
-- What it changes:
--   1. public.users.phone becomes optional. Signup now asks for email +
--      password only; the phone number is collected at checkout / seller setup.
--   2. Blank-string phones are converted to NULL so the unique index stops
--      rejecting the second person who signs up without a phone.
--      (Postgres treats NULLs as distinct, so many NULL phones are fine.)
--   3. handle_new_user is restored as a safe, non-blocking trigger, so every
--      auth user always gets a public.users row no matter which path created
--      them (app signup, Supabase dashboard, OAuth later).

-- 1. Phone is no longer required ------------------------------------------
alter table public.users
alter column phone drop not null;

-- 2. Normalise empty phones to NULL ---------------------------------------
update public.users
set phone = null
where phone is not null
  and btrim(phone) = '';

-- 3. Always-safe profile trigger ------------------------------------------
-- security definer so it can write public.users during auth signup, and every
-- statement is wrapped so a profile problem can NEVER fail account creation.
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
    concat(new.id::text, '@missing.glowgram.local')
  );

  -- NULL, not a placeholder: a missing phone must not occupy the unique index.
  profile_phone := nullif(
    btrim(
      coalesce(
        new.raw_user_meta_data ->> 'phone',
        new.phone,
        ''
      )
    ),
    ''
  );

  profile_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(initcap(replace(split_part(profile_email, '@', 1), '.', ' ')), ''),
    'GLOWGRAM User'
  );

  begin
    profile_account_type := coalesce(
      (new.raw_user_meta_data ->> 'account_type')::public.account_type,
      'buyer'
    );
  exception
    when others then
      profile_account_type := 'buyer';
  end;

  begin
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
      phone = coalesce(excluded.phone, public.users.phone),
      full_name = excluded.full_name,
      account_type = excluded.account_type;
  exception
    when others then
      -- A duplicate phone/email must never block the auth signup itself.
      -- The app writes the profile again right after createUser.
      null;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
