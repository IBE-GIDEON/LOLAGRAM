-- Product class, so the six shelves on the storefront filter on what a product
-- IS rather than on whether its name happens to contain a word.
--
-- Safe to re-run. Existing products land in 'wigs' rather than nowhere, so
-- nothing disappears from the shop the moment this is applied.
--
-- Deliberately text, not an enum. The vendor_category enum already caused a
-- silent breakage once: the app offered nine values Postgres rejected, and
-- store creation failed at the last step with a raw database error. Text keeps
-- the list in one place — PRODUCT_CATEGORIES in src/lib/product-categories.ts —
-- and adding a shelf later needs no migration at all.

alter table public.products
add column if not exists category text not null default 'wigs';

-- The storefront filters by this on every category tile and chip.
create index if not exists products_category_idx
on public.products (category, created_at desc);
