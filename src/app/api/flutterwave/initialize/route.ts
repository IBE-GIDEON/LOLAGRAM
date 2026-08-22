import { NextResponse } from "next/server"

import { getAppUrl } from "@/lib/app-url"
import { hasFlutterwave, hasSupabaseAdmin } from "@/lib/env"
import { createFlutterwavePayment } from "@/lib/flutterwave"
import { priceCart } from "@/lib/order-pricing"
import { verifyAuthToken } from "@/lib/supabase/auth-guard"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type CheckoutPayload } from "@/lib/types"
import { createPaymentReference } from "@/lib/utils"

/**
 * Flutterwave card checkout.
 *
 * The amount charged is priced from the products table, never from the request,
 * or a buyer could pay one naira for anything in the shop.
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

  if (!hasFlutterwave) {
    return NextResponse.json(
      { error: "Card checkout is not available yet." },
      { status: 503 }
    )
  }

  const priced = await priceCart(supabase, payload.items, payload.shippingMethod)
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: priced.status })
  }

  const txRef = createPaymentReference()

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      vendor_id: priced.vendorId,
      items: priced.items,
      total_amount: priced.totalAmount,
      delivery_fee: priced.deliveryFee,
      shipping_method: priced.shippingMethod,
      delivery_address: deliveryAddress,
      payment_method: "flutterwave",
      // Not paid until the webhook confirms it against Flutterwave.
      payment_status: "awaiting_card_payment",
      status: "pending",
      payment_reference: txRef
    })
    .select()
    .single()

  if (error || !order) {
    // Never echo Postgres errors back to the buyer.
    console.error("Flutterwave order insert failed", error?.message)
    return NextResponse.json(
      { error: "We could not start this checkout. Please try again." },
      { status: 500 }
    )
  }

  const { data: buyer } = await supabase
    .from("users")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle()

  try {
    const { checkoutUrl } = await createFlutterwavePayment({
      // Naira, not kobo — Flutterwave takes the major unit.
      amount: priced.totalAmount,
      email: user.email ?? `buyer-${user.id.slice(0, 8)}@afunwa.example`,
      name: buyer?.full_name ? String(buyer.full_name) : undefined,
      phone: buyer?.phone ? String(buyer.phone) : undefined,
      txRef,
      // getAppUrl, not env.appUrl: resolves from the deployment itself, so a
      // missing NEXT_PUBLIC_APP_URL cannot strand a paying customer.
      redirectUrl: `${getAppUrl()}/order-confirmation/${order.id}`,
      meta: {
        order_id: order.id,
        vendor_id: priced.vendorId,
        buyer_id: user.id
      }
    })

    return NextResponse.json({ checkoutUrl, orderId: order.id, reference: txRef })
  } catch (flutterwaveError) {
    // The order row exists but nothing can pay it — cancel rather than leave
    // the seller an order no one can settle.
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id)

    console.error("Flutterwave initialize failed", flutterwaveError)
    return NextResponse.json(
      { error: "Card checkout could not be started. Try another payment method." },
      { status: 502 }
    )
  }
}
