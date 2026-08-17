-- The "was" price, shown struck through beside what a buyer actually pays.
--
-- Safe to re-run. Nullable with no default: a product without one simply shows
-- a single price, which is every product that exists today.
--
-- Nothing prices an order from this column. Checkout reads `price` through
-- priceCart, so a compare-at value can never change what is charged — it is a
-- label, not money.

alter table public.products
add column if not exists compare_at_price numeric(12, 2);

-- A "was" price below the real one is not a discount, it is a lie, and it is
-- the kind of thing consumer protection regimes act on. The database refuses
-- it outright rather than trusting every form that ever writes here.
alter table public.products
drop constraint if exists products_compare_at_price_above_price;

alter table public.products
add constraint products_compare_at_price_above_price
check (compare_at_price is null or compare_at_price > price);
