-- Afunwa Hairline — delivery charges, and remembering a buyer's address.
-- Run once in the Supabase SQL editor. Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1. Remember the delivery address against the account, not just the browser.
--
--    It was being kept in localStorage, so it survived a return visit on the
--    same phone and nothing else — a buyer who ordered on a laptop and came
--    back on their phone typed the whole thing again.
--
--    jsonb rather than columns because the shape belongs to the checkout form
--    and will keep changing; nothing queries inside it.
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists delivery_address jsonb;

-- ---------------------------------------------------------------------------
-- 2. What the seller charges to deliver.
--
--    delivery_fee is flat. free_delivery_over, when set, waives it once the
--    items reach that amount. delivery_note is the free-text promise shown at
--    checkout, e.g. "2 to 4 working days, nationwide".
-- ---------------------------------------------------------------------------
alter table public.vendor_profiles
  add column if not exists delivery_fee numeric(12, 2) not null default 0;

alter table public.vendor_profiles
  add column if not exists free_delivery_over numeric(12, 2);

alter table public.vendor_profiles
  add column if not exists delivery_note text;

alter table public.vendor_profiles
  drop constraint if exists vendor_profiles_delivery_fee_positive;
alter table public.vendor_profiles
  add constraint vendor_profiles_delivery_fee_positive
  check (delivery_fee >= 0 and (free_delivery_over is null or free_delivery_over > 0));

-- ---------------------------------------------------------------------------
-- 3. What was actually charged to deliver this order.
--
--    Recorded per order rather than read back off the store, so changing the
--    fee tomorrow does not rewrite what yesterday's buyer was charged.
--    total_amount continues to be the whole sum, delivery included.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists delivery_fee numeric(12, 2) not null default 0;

alter table public.orders
  drop constraint if exists orders_delivery_fee_positive;
alter table public.orders
  add constraint orders_delivery_fee_positive check (delivery_fee >= 0);

commit;
