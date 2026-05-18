import { NextResponse } from "next/server"

import { sendPushNotification } from "@/lib/push"
import { verifyAuthToken } from "@/lib/supabase/auth-guard"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type OrderStatus, type PaymentStatus } from "@/lib/types"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require a valid Supabase session
  const user = await verifyAuthToken(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { status, paymentStatus } = (await request.json()) as {
    status?: OrderStatus
    paymentStatus?: PaymentStatus
  }
  const supabase = getSupabaseAdminClient()
  const updates: Record<string, string> = {}

  if (status) updates.status = status
  if (paymentStatus) updates.payment_status = paymentStatus

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true })
  }

  if (!supabase) {
    return NextResponse.json({ ok: true, status, paymentStatus })
  }

  // ── Ownership check ────────────────────────────────────────────────────────
  // Verify the caller is either the buyer or the seller of this order before
  // allowing any status mutation. Uses the admin client to bypass RLS so the
  // check always runs regardless of the session's RLS context.
  const { data: existing } = await supabase
    .from("orders")
    .select("buyer_id, vendor_id")
    .eq("id", params.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const isBuyer = existing.buyer_id === user.id

  // Resolve vendor owner — needed to confirm the caller is the seller
  const { data: vendorOwner } = await supabase
    .from("vendor_profiles")
    .select("user_id")
    .eq("id", String(existing.vendor_id))
    .maybeSingle()

  const isSeller = vendorOwner?.user_id === user.id

  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // ──────────────────────────────────────────────────────────────────────────

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

  const { data: vendor } = await supabase
    .from("vendor_profiles")
    .select("store_name")
    .eq("id", String(order.vendor_id))
    .maybeSingle()

  const storeName = getStoreName(vendor?.store_name)
  const orderRef = getOrderRef(params.id)

  const pushTitle =
    status === "confirmed"
      ? `${storeName} confirmed ${orderRef}`
      : status === "dispatched"
        ? `${storeName} dispatched ${orderRef}`
        : status === "delivered"
          ? `${storeName} delivered ${orderRef}`
          : status === "cancelled"
            ? `${storeName} cancelled ${orderRef}`
            : paymentStatus === "paid_to_vendor"
              ? `${storeName} confirmed your payment`
              : paymentStatus === "awaiting_vendor_payment"
                ? `${storeName} is ready for payment`
                : null

  const pushBody =
    status === "confirmed"
      ? String(order.payment_method) === "vendor_transfer"
        ? `${storeName} confirmed your order. Open ${orderRef} to see direct payment details.`
        : `${storeName} confirmed your order and will prepare it for delivery.`
      : status === "dispatched"
        ? `${storeName} has dispatched your items.`
        : status === "delivered"
          ? `${storeName} marked this order as delivered.`
          : status === "cancelled"
            ? `${storeName} cancelled this order.`
            : paymentStatus === "paid_to_vendor"
              ? `${storeName} marked your direct payment as received.`
              : paymentStatus === "awaiting_vendor_payment"
                ? `Open ${orderRef} to pay ${storeName} directly.`
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

function getStoreName(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : ""
  return normalized || "Your seller"
}

function getOrderRef(orderId: string) {
  return `#${orderId.slice(0, 6).toUpperCase()}`
}
