import { NextResponse } from "next/server"

import { getAppUrl } from "@/lib/app-url"
import { hasPaystack, hasSupabaseAdmin } from "@/lib/env"
import { priceCart } from "@/lib/order-pricing"
import { initializePaystackTransaction } from "@/lib/paystack"
import { verifyAuthToken } from "@/lib/supabase/auth-guard"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type CheckoutPayload } from "@/lib/types"
import { createPaystackReference } from "@/lib/utils"

/**
 * Paystack card checkout.
 *
 * The amount charged is priced from the products table, never from the request.
 * This route previously took totalAmount off the client, which was safe only
 * because nothing called it — with card checkout live, that would have let a
 * buyer pay one naira for anything in the shop.
 */
export async function POST(request: Request) {
  const user = await verifyAuthToken(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as CheckoutPayload | null

  if (!payload?.buyerId) {
    return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 })
  }

  // Prevent a user from checking out on behalf of someone else
  if (payload.buyerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const deliveryAddress = String(payload.deliveryAddress ?? "").trim()
  if (!deliveryAddress) {
    return NextResponse.json(
      { error: "A delivery address is required." },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdminClient()

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

  const priced = await priceCart(supabase, payload.items)
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: priced.status })
  }

  const reference = createPaystackReference()

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      vendor_id: priced.vendorId,
      items: priced.items,
      total_amount: priced.totalAmount,
      delivery_address: deliveryAddress,
      payment_method: "paystack",
      // Not paid until the webhook says so — the buyer has not reached
      // Paystack's page yet, let alone completed anything on it.
      payment_status: "awaiting_card_payment",
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

  try {
    const transaction = await initializePaystackTransaction({
      amount: priced.totalAmount,
      email: user.email ?? `buyer-${user.id.slice(0, 8)}@afunwa.example`,
      reference,
      // getAppUrl, not env.appUrl: on Vercel this resolves from the deployment
      // itself, so a missing NEXT_PUBLIC_APP_URL cannot send a paying customer
      // back to localhost.
      callbackUrl: `${getAppUrl()}/order-confirmation/${order.id}`,
      metadata: {
        order_id: order.id,
        vendor_id: priced.vendorId,
        buyer_id: user.id
      }
    })

    return NextResponse.json({
      checkoutUrl: transaction.data.authorization_url,
      orderId: order.id,
      reference
    })
  } catch (paystackError) {
    // The order row exists but no payment can reach it — cancel it rather than
    // leave the seller staring at an order nobody can pay for.
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id)

    console.error("Paystack initialize failed", paystackError)
    return NextResponse.json(
      { error: "Card checkout could not be started. Try another payment method." },
      { status: 502 }
    )
  }
}
