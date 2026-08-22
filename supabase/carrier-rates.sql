-- Afunwa Hairline — what a carrier needs before it can quote a price.
-- Run after shipping-methods.sql. Safe to re-run.
--
-- A courier quote is computed from weight, size, where it leaves from and
-- where it goes. The destination alone cannot produce a price, which is why
-- none of this could be skipped.

begin;

-- ---------------------------------------------------------------------------
-- 1. What each item weighs.
--
--    Kilograms, nullable. Anything left blank falls back to the store's
--    default below, and if that is unset too the carrier is not called at all
--    and the flat rate stands — better than shipping a guess to DHL and
--    charging the buyer whatever comes back.
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists weight_kg numeric(8, 3);

alter table public.products
  drop constraint if exists products_weight_positive;
alter table public.products
  add constraint products_weight_positive
  check (weight_kg is null or (weight_kg > 0 and weight_kg <= 500));

-- ---------------------------------------------------------------------------
-- 2. Where the parcel leaves from, and the box it goes in.
--
--    Every carrier rate call needs an origin. The package dimensions are a
--    single default in centimetres rather than per product, which is honest
--    for a shop sending wigs in one size of box.
-- ---------------------------------------------------------------------------
alter table public.vendor_profiles
  add column if not exists origin_address text;
alter table public.vendor_profiles
  add column if not exists origin_city text;
alter table public.vendor_profiles
  add column if not exists origin_state text;
alter table public.vendor_profiles
  add column if not exists origin_postcode text;
alter table public.vendor_profiles
  add column if not exists origin_country text not null default 'NG';

alter table public.vendor_profiles
  add column if not exists default_item_weight_kg numeric(8, 3);
alter table public.vendor_profiles
  add column if not exists package_length_cm numeric(8, 2) not null default 30;
alter table public.vendor_profiles
  add column if not exists package_width_cm numeric(8, 2) not null default 25;
alter table public.vendor_profiles
  add column if not exists package_height_cm numeric(8, 2) not null default 15;

alter table public.vendor_profiles
  drop constraint if exists vendor_profiles_package_positive;
alter table public.vendor_profiles
  add constraint vendor_profiles_package_positive
  check (
    package_length_cm > 0
    and package_width_cm > 0
    and package_height_cm > 0
    and (default_item_weight_kg is null or default_item_weight_kg > 0)
  );

-- ---------------------------------------------------------------------------
-- 3. Where the price on an order came from.
--
--    'flat' means the seller's own rate, 'carrier' means the courier quoted
--    it live. Worth recording: when a buyer queries a charge, this says
--    whether to check the rate card or the carrier's invoice.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists shipping_quote_source text not null default 'flat';

alter table public.orders
  drop constraint if exists orders_shipping_quote_source_valid;
alter table public.orders
  add constraint orders_shipping_quote_source_valid
  check (shipping_quote_source in ('flat', 'carrier'));

commit;
