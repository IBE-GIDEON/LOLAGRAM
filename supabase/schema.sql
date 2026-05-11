create extension if not exists "pgcrypto";

create type public.account_type as enum ('buyer', 'seller', 'both');
create type public.vendor_category as enum ('cosmetics', 'wigs', 'jewellery', 'watches', 'fashion', 'other');
create type public.order_status as enum ('pending', 'confirmed', 'dispatched', 'delivered', 'cancelled');

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text unique not null,
  full_name text not null,
  profile_photo_url text,
  recovery_email text,
  account_type public.account_type not null default 'buyer',
  created_at timestamptz not null default now()
);

alter table public.users
add column if not exists recovery_email text;

create table if not exists public.vendor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  store_name text not null,
  store_photo_url text,
  bio text,
  category public.vendor_category not null default 'other',
  city text not null,
  whatsapp_number text not null,
  is_active boolean not null default true,
  total_sales integer not null default 0,
  rating double precision not null default 0,
  created_at timestamptz not null default now(),
  search_text tsvector not null default ''::tsvector
);

alter table public.vendor_profiles drop column if exists search_text;
alter table public.vendor_profiles
add column if not exists search_text tsvector not null default ''::tsvector;

create unique index if not exists vendor_profiles_user_id_key on public.vendor_profiles(user_id);
create index if not exists vendor_profiles_recent_idx on public.vendor_profiles (created_at desc);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  name text not null,
  description text,
  price numeric(12, 2) not null,
  photo_url text,
  photo_urls jsonb not null default '[]'::jsonb,
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products
add column if not exists photo_urls jsonb not null default '[]'::jsonb;

update public.products
set photo_urls = case
  when jsonb_array_length(photo_urls) > 0 then photo_urls
  when photo_url is null or btrim(photo_url) = '' then '[]'::jsonb
  when left(btrim(photo_url), 1) = '[' then photo_url::jsonb
  else jsonb_build_array(photo_url)
end
where coalesce(jsonb_array_length(photo_urls), 0) = 0;

create index if not exists products_vendor_id_idx on public.products(vendor_id);
create index if not exists products_recent_idx on public.products(created_at desc);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users (id) on delete cascade,
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(12, 2) not null,
  status public.order_status not null default 'pending',
  paystack_reference text,
  delivery_address text not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_vendor_idx on public.orders (vendor_id, created_at desc);
create index if not exists orders_reference_idx on public.orders (paystack_reference);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  buyer_id uuid not null references public.users (id) on delete cascade,
  vendor_id uuid not null references public.vendor_profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create unique index if not exists reviews_order_id_key on public.reviews(order_id);
create index if not exists reviews_vendor_idx on public.reviews (vendor_id, created_at desc);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, phone, full_name, account_type)
  values (
    new.id,
    coalesce(new.phone, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New LOLAGRAM User'),
    coalesce((new.raw_user_meta_data ->> 'account_type')::public.account_type, 'buyer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.update_vendor_search_text()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.search_text :=
    setweight(to_tsvector('simple', coalesce(new.store_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.category::text, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.city, '')), 'C');
  return new;
end;
$$;

drop trigger if exists vendor_profiles_search_text_before_write on public.vendor_profiles;
create trigger vendor_profiles_search_text_before_write
before insert or update of store_name, category, city
on public.vendor_profiles
for each row execute procedure public.update_vendor_search_text();

update public.vendor_profiles
set search_text =
  setweight(to_tsvector('simple', coalesce(store_name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(category::text, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(city, '')), 'C');

create index if not exists vendor_profiles_search_idx on public.vendor_profiles using gin (search_text);

create or replace function public.update_vendor_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vendor_profiles
  set rating = coalesce((
    select avg(r.rating)::double precision
    from public.reviews r
    where r.vendor_id = coalesce(new.vendor_id, old.vendor_id)
  ), 0)
  where id = coalesce(new.vendor_id, old.vendor_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_after_write on public.reviews;
create trigger reviews_after_write
after insert or update or delete on public.reviews
for each row execute procedure public.update_vendor_rating();

alter table public.users enable row level security;
alter table public.vendor_profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Users can view their own profile"
on public.users for select
using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.users for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Anyone can view active vendor profiles"
on public.vendor_profiles for select
using (is_active = true or user_id = auth.uid());

create policy "Sellers can insert their own vendor profile"
on public.vendor_profiles for insert
with check (auth.uid() = user_id);

create policy "Sellers can update their own vendor profile"
on public.vendor_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Anyone can view products from active vendors"
on public.products for select
using (
  exists (
    select 1 from public.vendor_profiles vp
    where vp.id = vendor_id
      and (vp.is_active = true or vp.user_id = auth.uid())
  )
);

create policy "Sellers can manage their own products"
on public.products for all
using (
  exists (
    select 1 from public.vendor_profiles vp
    where vp.id = vendor_id
      and vp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.vendor_profiles vp
    where vp.id = vendor_id
      and vp.user_id = auth.uid()
  )
);

create policy "Buyers can view their own orders"
on public.orders for select
using (
  buyer_id = auth.uid()
  or exists (
    select 1 from public.vendor_profiles vp
    where vp.id = vendor_id
      and vp.user_id = auth.uid()
  )
);

create policy "Buyers can create their own orders"
on public.orders for insert
with check (buyer_id = auth.uid());

create policy "Sellers can update store orders"
on public.orders for update
using (
  exists (
    select 1 from public.vendor_profiles vp
    where vp.id = vendor_id
      and vp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.vendor_profiles vp
    where vp.id = vendor_id
      and vp.user_id = auth.uid()
  )
);

create policy "Users can view reviews for accessible vendors"
on public.reviews for select
using (
  exists (
    select 1 from public.vendor_profiles vp
    where vp.id = vendor_id
      and (vp.is_active = true or vp.user_id = auth.uid())
  )
);

create policy "Buyers can create reviews for their own orders"
on public.reviews for insert
with check (
  buyer_id = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.buyer_id = auth.uid()
      and o.vendor_id = reviews.vendor_id
      and o.status = 'delivered'
  )
);

create policy "Users can manage their push subscriptions"
on public.push_subscriptions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

create policy "Public can read store assets"
on storage.objects for select
using (bucket_id = 'store-assets');

create policy "Authenticated users can upload store assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'store-assets');

create policy "Users can update store assets"
on storage.objects for update
to authenticated
using (bucket_id = 'store-assets')
with check (bucket_id = 'store-assets');
