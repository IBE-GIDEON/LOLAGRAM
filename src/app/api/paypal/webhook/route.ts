import { NextResponse } from "next/server"

import {
  convertFromBaseCurrency,
  readPayPalOrder,
  verifyPayPalWebhook
} from "@/lib/paypal"
import { sendPushNotification } from "@/lib/push"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

/**
 * PayPal payment notifications.
 *
 * The only thing that may mark a PayPal order paid. A buyer landing back on
 * the return URL proves nothing — anyone can type that address — so a signed
 * event, re-read from PayPal, is the authority.
 */
export async function POST(request: Request) {
  const rawBody = await request.text()

  if (!(await verifyPayPalWebhook(request.headers, rawBody))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(rawBody) as {
    event_type?: string
    resource?: {
      id?: string
      custom_id?: string
      supplementary_data?: { related_ids?: { order_id?: string } }
    }
  }

  // Both arrive for a completed checkout; either is enough to go and look.
  const relevant =
    event.event_type === "CHECKOUT.ORDER.APPROVED" ||
    event.event_type === "PAYMENT.CAPTURE.COMPLETED"

  if (!relevant) {
    return NextResponse.json({ ok: true })
  }

  const paypalOrderId =
    event.resource?.supplementary_data?.related_ids?.order_id ?? event.resource?.id

  if (!paypalOrderId) {
    return NextResponse.json({ ok: true })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return NextResponse.json({ ok: true })
  }

  const paypalOrder = await readPayPalOrder(paypalOrderId)
  if (!paypalOrder) {
    console.error(`PayPal order ${paypalOrderId} could not be read back`)
    return NextResponse.json({ ok: true })
  }

  // Our own id travels on the purchase unit, so a tampered custom_id cannot
  // point the payment at somebody else's order — it is read from PayPal, not
  // from the webhook body.
  const orderId = paypalOrder.purchase_units?.[0]?.custom_id
  if (!orderId) {
    return NextResponse.json({ ok: true })
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*, vendor_profiles(user_id)")
    .eq("id", orderId)
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ ok: true })
  }

  // PayPal retries until it gets a 200, and sends two event types for one
  // payment. Acknowledge and stop rather than notify the seller twice.
  if (order.payment_status === "paid_by_card") {
    return NextResponse.json({ ok: true })
  }

  const capture = paypalOrder.purchase_units?.[0]?.payments?.captures?.find(
    (entry) => entry.status === "COMPLETED"
  )

  if (paypalOrder.status !== "COMPLETED" || !capture) {
    // Approved but not captured yet: the capture event will follow.
    return NextResponse.json({ ok: true })
  }

  const paid = Number(capture.amount?.value ?? 0)
  const paidCurrency = String(capture.amount?.currency_code ?? "")

  let owed
  try {
    owed = await convertFromBaseCurrency(Number(order.total_amount))
  } catch {
    console.error(`No rate to check PayPal payment on order ${orderId}`)
    return NextResponse.json({ ok: true })
  }

  // The rate moves between starting checkout and finishing it, so a small
  // shortfall is the market rather than a fraud. Anything past two percent is
  // treated as a mismatch and left for a human.
  const tolerance = owed.amount * 0.02

  if (paidCurrency !== owed.currency || paid + tolerance < owed.amount) {
    console.error(
      `PayPal amount mismatch on order ${orderId}: paid ${paid} ${paidCurrency}, owed ${owed.amount} ${owed.currency}`
    )
    return NextResponse.json({ ok: true })
  }

  await supabase
    .from("orders")
    .update({
      payment_reference: paypalOrderId,
      payment_status: "paid_by_card",
      status: order.status === "pending" ? "confirmed" : order.status
    })
    .eq("id", order.id)

  const vendorUserId =
    order.vendor_profiles && "user_id" in order.vendor_profiles
      ? String(order.vendor_profiles.user_id)
      : null

  if (vendorUserId) {
    await sendPushNotification({
      userId: vendorUserId,
      title: "Paid order on Afunwa",
      body: "A buyer just paid with PayPal. Get it ready to ship.",
      url: `/orders/${order.id}`
    })
  }

  return NextResponse.json({ ok: true })
}
