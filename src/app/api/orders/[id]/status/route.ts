import { NextResponse } from "next/server"

import { sendPushNotification } from "@/lib/push"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type OrderStatus, type PaymentStatus } from "@/lib/types"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { status, paymentStatus } = (await request.json()) as {
    status?: OrderStatus
    paymentStatus?: PaymentStatus
  }
  const supabase = getSupabaseAdminClient()
  const updates: Record<string, string> = {}

  if (status) {
    updates.status = status
  }

  if (paymentStatus) {
    updates.payment_status = paymentStatus
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true })
  }

  if (!supabase) {
    return NextResponse.json({ ok: true, status, paymentStatus })
  }

  const { data: order, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error || !order) {
    const message = error?.message?.toLowerCase() ?? ""
    if (message.includes("payment_status")) {
      return NextResponse.json(
        { error: "Run the latest Supabase order-payment SQL patch, then update the order again." },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: error?.message ?? "Order not found" }, { status: 500 })
  }

  const pushTitle =
    status === "confirmed"
      ? "Your LOLAGRAM order is confirmed"
      : status === "dispatched"
        ? "Your LOLAGRAM order is on the way"
        : status === "delivered"
          ? "Your LOLAGRAM order has been delivered"
          : status === "cancelled"
            ? "Your LOLAGRAM order was cancelled"
            : paymentStatus === "paid_to_vendor"
              ? "Your payment was confirmed"
              : paymentStatus === "awaiting_vendor_payment"
                ? "Pay your seller directly"
                : null

  const pushBody =
    status === "confirmed"
      ? String(order.payment_method) === "vendor_transfer"
        ? "The seller confirmed your order. Pay the vendor directly to continue."
        : "The seller confirmed your order."
      : status === "dispatched"
        ? "The seller has dispatched your items."
        : status === "delivered"
          ? "Your seller marked this order as delivered."
          : status === "cancelled"
            ? "The seller cancelled this order."
            : paymentStatus === "paid_to_vendor"
              ? "The seller marked your direct payment as received."
              : paymentStatus === "awaiting_vendor_payment"
                ? "Your seller is ready for direct vendor payment now."
                : null

  if (pushTitle && pushBody) {
    void sendPushNotification({
      userId: String(order.buyer_id),
      title: pushTitle,
      body: pushBody,
      url: `/orders/${params.id}`
    }).catch(() => null)
  }

  return NextResponse.json({ ok: true, order })
}
