import { NextResponse } from "next/server"

import {
  verifyFlutterwaveSignature,
  verifyFlutterwaveTransaction
} from "@/lib/flutterwave"
import { sendPushNotification } from "@/lib/push"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

/**
 * Flutterwave payment notifications.
 *
 * The only thing that may mark an order paid. A buyer landing on the redirect
 * URL proves nothing — anyone can type that address — so a signed event,
 * re-confirmed against Flutterwave, is the authority.
 */
export async function POST(request: Request) {
  const rawBody = await request.text()

  if (!verifyFlutterwaveSignature(request.headers.get("verif-hash"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(rawBody) as {
    event?: string
    data?: {
      id?: number | string
      tx_ref?: string
      status?: string
      amount?: number
      currency?: string
      meta?: { order_id?: string }
    }
  }

  const orderId = event.data?.meta?.order_id
  if (event.event !== "charge.completed" || !orderId || !event.data?.id) {
    return NextResponse.json({ ok: true })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
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

  // Flutterwave retries until it gets a 200, so the same success arrives more
  // than once. Acknowledge and stop rather than notify the seller twice.
  if (order.payment_status === "paid_by_card") {
    return NextResponse.json({ ok: true })
  }

  // Ask Flutterwave what actually happened rather than believing the body.
  const verified = await verifyFlutterwaveTransaction(event.data.id)

  if (!verified || verified.status !== "successful") {
    console.error(`Flutterwave verify failed for order ${orderId}`)
    return NextResponse.json({ ok: true })
  }

  const paid = Number(verified.amount ?? 0)
  const owed = Number(order.total_amount)

  // Naira on both sides here — Flutterwave reports the major unit.
  if (verified.currency !== "NGN" || !Number.isFinite(paid) || paid < owed) {
    console.error(
      `Flutterwave amount mismatch on order ${orderId}: paid ${paid} ${verified.currency}, owed ${owed} NGN`
    )
    return NextResponse.json({ ok: true })
  }

  await supabase
    .from("orders")
    .update({
      payment_reference: verified.tx_ref ?? order.payment_reference,
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
