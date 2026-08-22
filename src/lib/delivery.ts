/**
 * What delivery costs, in one place.
 *
 * The checkout page shows this figure and the server charges it, so the two
 * must agree exactly. They agree by calling the same function rather than by
 * two people implementing the same rule twice — a quoted total that differs
 * from the charged one is the worst kind of bug in a shop.
 */
export interface DeliveryTerms {
  /** Flat charge, in naira. */
  fee?: number
  /** Once the items reach this, delivery is free. */
  freeOver?: number
  /** The seller's own wording, e.g. "2 to 4 working days". */
  note?: string
}

export function computeDeliveryFee(itemsTotal: number, terms: DeliveryTerms) {
  const fee = Number(terms.fee ?? 0)
  if (!Number.isFinite(fee) || fee <= 0) return 0

  const freeOver = Number(terms.freeOver ?? 0)
  if (Number.isFinite(freeOver) && freeOver > 0 && itemsTotal >= freeOver) {
    return 0
  }

  // numeric(12,2) in Postgres — settle the rounding here.
  return Math.round(fee * 100) / 100
}

/** How much more is needed before delivery stops being charged, if ever. */
export function amountToFreeDelivery(itemsTotal: number, terms: DeliveryTerms) {
  const freeOver = Number(terms.freeOver ?? 0)
  if (!Number.isFinite(freeOver) || freeOver <= 0) return 0
  if (itemsTotal >= freeOver) return 0
  return Math.round((freeOver - itemsTotal) * 100) / 100
}
