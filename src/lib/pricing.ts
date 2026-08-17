/**
 * The struck-through "was" price.
 *
 * Display only. Checkout prices every order from `price` via priceCart, so
 * nothing here can change what a buyer is charged.
 */

/**
 * Returns a usable compare-at price, or undefined.
 *
 * A "was" price at or below the real one is not a discount — it is a false
 * saving, which consumer protection law treats as a misrepresentation rather
 * than a rounding problem. Anything that is not strictly higher is dropped
 * rather than rendered, and the database rejects it too.
 */
export function normalizeCompareAtPrice(
  value: unknown,
  price: number
): number | undefined {
  const compareAt = Number(value)

  if (!Number.isFinite(compareAt) || compareAt <= 0) return undefined
  if (!Number.isFinite(price) || compareAt <= price) return undefined

  return compareAt
}

/** Whole-percent saving, or null when there is no genuine discount. */
export function getDiscountPercent(price: number, compareAtPrice?: number) {
  const compareAt = normalizeCompareAtPrice(compareAtPrice, price)
  if (!compareAt) return null

  const percent = Math.round(((compareAt - price) / compareAt) * 100)
  return percent > 0 ? percent : null
}
