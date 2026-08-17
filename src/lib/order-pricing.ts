import { type SupabaseClient } from "@supabase/supabase-js"

import { type OrderItem } from "@/lib/types"

export type PricedCart =
  | { ok: true; vendorId: string; items: OrderItem[]; totalAmount: number }
  | { ok: false; status: number; error: string }

/**
 * Resolves a cart against the database and prices it there.
 *
 * The browser only gets to say which product and how many. Price, name and the
 * owning vendor all come from the products table, because a total taken from
 * the request means a buyer can pay one naira for a 155,000 naira unit — and
 * both checkout routes run with the service role key, so nothing else would
 * catch it.
 *
 * Shared by /api/orders and /api/paystack/initialize so card and transfer
 * checkout can never disagree about what an order is worth.
 */
export async function priceCart(
  supabase: SupabaseClient,
  rawItems: unknown
): Promise<PricedCart> {
  const requested = new Map<string, number>()

  for (const item of Array.isArray(rawItems) ? rawItems : []) {
    const productId = String(
      (item as { productId?: unknown })?.productId ?? ""
    ).trim()
    const quantity = Math.floor(Number((item as { quantity?: unknown })?.quantity ?? 0))

    if (!productId || !Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return {
        ok: false,
        status: 400,
        error: "That cart is not valid. Refresh and try again."
      }
    }

    requested.set(productId, (requested.get(productId) ?? 0) + quantity)
  }

  if (requested.size === 0) {
    return { ok: false, status: 400, error: "Your cart is empty." }
  }

  const { data: rows, error } = await supabase
    .from("products")
    .select("id, name, price, in_stock, vendor_id, vendor_profiles!inner(is_active)")
    .eq("vendor_profiles.is_active", true)
    .in("id", [...requested.keys()])

  if (error) {
    return { ok: false, status: 500, error: error.message }
  }

  if (!rows || rows.length !== requested.size) {
    return {
      ok: false,
      status: 409,
      error: "Something in your cart is no longer available. Refresh and try again."
    }
  }

  const outOfStock = rows.find((row) => !row.in_stock)
  if (outOfStock) {
    return {
      ok: false,
      status: 409,
      error: `${String(outOfStock.name)} just went out of stock.`
    }
  }

  const vendorIds = new Set(rows.map((row) => String(row.vendor_id)))
  if (vendorIds.size !== 1) {
    return {
      ok: false,
      status: 400,
      error: "An order can only contain items from one store."
    }
  }

  const items: OrderItem[] = rows.map((row) => ({
    productId: String(row.id),
    name: String(row.name),
    price: Number(row.price),
    quantity: requested.get(String(row.id)) as number
  }))

  // numeric(12,2) in Postgres — settle the rounding here rather than let the
  // database truncate a floating point tail.
  const totalAmount =
    Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
    ) / 100

  return { ok: true, vendorId: [...vendorIds][0], items, totalAmount }
}
