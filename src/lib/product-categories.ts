/**
 * The shelves a product can sit on.
 *
 * One list, used by the home rail, the search chips and the seller's product
 * form, so a shelf can never exist in one place and not another. The stored
 * value is plain text in products.category — see
 * supabase/product-categories.sql for why it is not an enum.
 */
export const PRODUCT_CATEGORIES = [
  { value: "wigs", label: "Wigs" },
  { value: "futura", label: "Futura wigs" },
  { value: "closures", label: "Closures and frontals" },
  { value: "essentials", label: "Hair essentials" },
  { value: "combo", label: "Combo deals" },
  { value: "bundles", label: "Bundles" }
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["value"]

export const PRODUCT_CATEGORY_VALUES = PRODUCT_CATEGORIES.map((c) => c.value)

export const DEFAULT_PRODUCT_CATEGORY: ProductCategory = "wigs"

export function isProductCategory(value: unknown): value is ProductCategory {
  return (
    typeof value === "string" &&
    (PRODUCT_CATEGORY_VALUES as readonly string[]).includes(value)
  )
}

/** Anything unrecognised falls back to wigs rather than vanishing from the shop. */
export function normalizeProductCategory(value: unknown): ProductCategory {
  return isProductCategory(value) ? value : DEFAULT_PRODUCT_CATEGORY
}

export function getProductCategoryLabel(value: unknown) {
  const category = normalizeProductCategory(value)
  return (
    PRODUCT_CATEGORIES.find((entry) => entry.value === category)?.label ?? "Wigs"
  )
}
