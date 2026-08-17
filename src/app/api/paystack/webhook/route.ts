import { NextResponse } from "next/server"

import { sendPushNotification } from "@/lib/push"
import { verifyPaystackSignature } from "@/lib/paystack"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

/**
 * Paystack payment notifications.
 *
 * This is the only thing that may mark an order paid. The buyer returning to
 * the callback URL proves nothing — they can reach that page by typing it — so
 * the signed webhook is the authority.
 */
export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature")

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(rawBody) as {
    event: string
    data?: {
      reference?: string
      /** Kobo, not naira. */
      amount?: number
      status?: string
      metadata?: { order_id?: string }
    }
  }

  if (event.event !== "charge.success" || !event.data?.metadata?.order_id) {
    return NextResponse.json({ ok: true })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return NextResponse.json({ ok: true })
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*, vendor_profiles(user_id)")
    .eq("id", event.data.metadata.order_id)
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ ok: true })
  }

  // Paystack retries until it gets a 200, so the same success can arrive
  // several times. Acknowledge and stop rather than notify the seller twice.
  if (order.payment_status === "paid_by_card") {
    return NextResponse.json({ ok: true })
  }

  // What was actually charged has to match what the order is worth. Without
  // this, a payment created for one order could be pointed at a dearer one.
  const paidKobo = Number(event.data.amount ?? 0)
  const owedKobo = Math.round(Number(order.total_amount) * 100)

  if (!Number.isFinite(paidKobo) || paidKobo < owedKobo) {
    console.error(
      `Paystack amount mismatch on order ${order.id}: paid ${paidKobo}, owed ${owedKobo}`
    )
    return NextResponse.json({ ok: true })
  }

  await supabase
    .from("orders")
    .update({
      paystack_reference: event.data.reference ?? order.paystack_reference,
      payment_status: "paid_by_card",
      // Money is in, so the seller is packing rather than deciding.
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
      body: "A buyer just paid by card. Get it ready to ship.",
      url: `/orders/${order.id}`
    })
  }

  return NextResponse.json({ ok: true })
}
