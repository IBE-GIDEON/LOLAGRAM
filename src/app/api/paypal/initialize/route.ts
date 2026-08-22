import { NextResponse } from "next/server"

import { env, hasPayPal, hasSupabaseAdmin } from "@/lib/env"
import { priceCart, toRateAddress } from "@/lib/order-pricing"
import {
  buildPayPalReference,
  convertFromBaseCurrency,
  createPayPalOrder
} from "@/lib/paypal"
import { verifyAuthToken } from "@/lib/supabase/auth-guard"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type CheckoutPayload } from "@/lib/types"

/**
 * Starts a PayPal checkout.
 *
 * Mirrors the Flutterwave route exactly, including the rule that matters: the
 * order is written first, priced from the database, and marked awaiting rather
 * than paid. Only the webhook may say it is paid.
 *
 * The one difference is currency. PayPal does not settle naira, so the order
 * is presented in dollars converted at the rate the shop is already quoting.
 * The naira figure stays on the order as what is owed.
 */
export async function POST(request: Request) {
  const user = await verifyAuthToken(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json()) as CheckoutPayload
  const deliveryAddress = String(payload.deliveryAddress ?? "").trim()

  if (!deliveryAddress) {
    return NextResponse.json(
      { error: "Add a delivery address before paying." },
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

  if (!hasPayPal) {
    return NextResponse.json(
      { error: "PayPal is not available yet." },
      { status: 503 }
    )
  }

  const priced = await priceCart(
    supabase,
    payload.items,
    payload.shippingMethod,
    toRateAddress(payload.shippingDestination)
  )
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: priced.status })
  }

  let converted
  try {
    converted = await convertFromBaseCurrency(priced.totalAmount)
  } catch {
    return NextResponse.json(
      { error: "Could not price this in PayPal's currency. Try another method." },
      { status: 503 }
    )
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      vendor_id: priced.vendorId,
      items: priced.items,
      // Naira remains what is owed; the dollar figure is only how it is taken.
      total_amount: priced.totalAmount,
      delivery_fee: priced.deliveryFee,
      shipping_method: priced.shippingMethod,
      shipping_quote_source: priced.shippingQuoteSource,
      delivery_address: deliveryAddress,
      payment_method: "paypal",
      payment_status: "awaiting_card_payment",
      status: "pending",
      payment_reference: buildPayPalReference(user.id)
    })
    .select()
    .single()

  if (error || !order) {
    console.error("PayPal order insert failed", error?.message)
    return NextResponse.json(
      { error: "We could not start this checkout. Please try again." },
      { status: 500 }
    )
  }

  try {
    const { checkoutUrl, paypalOrderId } = await createPayPalOrder({
      amount: converted.amount,
      currency: converted.currency,
      orderId: String(order.id),
      returnUrl: `${env.appUrl}/order-confirmation/${order.id}`,
      cancelUrl: `${env.appUrl}/checkout`
    })

    // PayPal's own id, so the webhook can re-read the order from them.
    await supabase
      .from("orders")
      .update({ payment_reference: paypalOrderId })
      .eq("id", order.id)

    return NextResponse.json({ checkoutUrl, orderId: order.id })
  } catch (paypalError) {
    console.error("PayPal checkout failed", paypalError)
    // The order exists but was never paid for. Leave it awaiting rather than
    // deleting it, so a buyer who did pay is never left without a record.
    return NextResponse.json(
      { error: "PayPal could not start this payment. Try another method." },
      { status: 502 }
    )
  }
}
