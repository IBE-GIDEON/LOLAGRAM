import { NextResponse } from "next/server"

import { env, hasPaystack, hasSupabaseAdmin } from "@/lib/env"
import { initializePaystackTransaction } from "@/lib/paystack"
import { verifyAuthToken } from "@/lib/supabase/auth-guard"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type CheckoutPayload } from "@/lib/types"
import { createPaystackReference } from "@/lib/utils"

/**
 * Paystack card checkout. The live cart currently orders through /api/orders
 * (vendor transfer / pay on delivery), so this route is dormant — but it is
 * publicly reachable and holds live payment keys, so it is guarded exactly
 * like /api/orders.
 *
 * Before enabling card checkout: totalAmount below is taken from the client.
 * It MUST be recomputed from the products table first, or a buyer can pay any
 * amount they like for any item.
 */
export async function POST(request: Request) {
  // Require a valid Supabase session
  const user = await verifyAuthToken(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as CheckoutPayload | null

  if (!payload?.buyerId || !payload.vendorId) {
    return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 })
  }

  // Prevent a user from checking out on behalf of someone else
  if (payload.buyerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!Number.isFinite(payload.totalAmount) || payload.totalAmount <= 0) {
    return NextResponse.json({ error: "Invalid order total." }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const reference = createPaystackReference()

  if (!hasSupabaseAdmin || !supabase) {
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    )
  }

  if (!hasPaystack) {
    return NextResponse.json(
      { error: "Card checkout is not available yet." },
      { status: 503 }
    )
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: payload.buyerId,
      vendor_id: payload.vendorId,
      items: payload.items,
      total_amount: payload.totalAmount,
      delivery_address: payload.deliveryAddress,
      status: "pending",
      paystack_reference: reference
    })
    .select()
    .single()

  if (error || !order) {
    // Never echo Postgres errors back to the buyer.
    console.error("Paystack order insert failed", error?.message)
    return NextResponse.json(
      { error: "We could not start this checkout. Please try again." },
      { status: 500 }
    )
  }

  const transaction = await initializePaystackTransaction({
    amount: payload.totalAmount,
    email: user.email ?? `buyer-${payload.buyerId.slice(0, 8)}@glowgram.app`,
    reference,
    callbackUrl: `${env.appUrl}/order-confirmation/${order.id}`,
    metadata: {
      order_id: order.id,
      vendor_id: payload.vendorId,
      buyer_id: payload.buyerId
    }
  })

  return NextResponse.json({
    checkoutUrl: transaction.data.authorization_url,
    orderId: order.id,
    reference
  })
}
