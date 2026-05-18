import { NextResponse } from "next/server"

import { hasSupabaseAdmin } from "@/lib/env"
import { sendPushNotification } from "@/lib/push"
import { verifyAuthToken } from "@/lib/supabase/auth-guard"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type CheckoutPayload } from "@/lib/types"

export async function POST(request: Request) {
  // Require a valid Supabase session
  const user = await verifyAuthToken(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json()) as CheckoutPayload

  // Prevent a user from placing orders on behalf of someone else
  if (payload.buyerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = getSupabaseAdminClient()

  if (!hasSupabaseAdmin || !supabase) {
    return NextResponse.json(
      { error: "Supabase admin configuration is missing for order creation." },
      { status: 503 }
    )
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: payload.buyerId,
      vendor_id: payload.vendorId,
      items: payload.items,
      total_amount: payload.totalAmount,
      delivery_address: payload.deliveryAddress,
      payment_method: payload.paymentMethod,
      payment_status:
        payload.paymentMethod === "vendor_transfer"
          ? "awaiting_seller_confirmation"
          : "pay_on_delivery",
      buyer_payment_note: payload.buyerPaymentNote ?? null,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    const message = error.message.toLowerCase()
    if (
      message.includes("payment_method") ||
      message.includes("payment_status") ||
      message.includes("buyer_payment_note")
    ) {
      return NextResponse.json(
        { error: "Run the latest Supabase order-payment SQL patch, then place the order again." },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: vendor } = await supabase
    .from("vendor_profiles")
    .select("user_id, store_name")
    .eq("id", payload.vendorId)
    .maybeSingle()

  const { data: buyer } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", payload.buyerId)
    .maybeSingle()

  if (vendor?.user_id) {
    const buyerName = getDisplayName(buyer?.full_name)
    const orderRef = getOrderRef(String(data.id))

    void sendPushNotification({
      userId: String(vendor.user_id),
      title: "New Order on LOLAGRAM",
      body: `${buyerName} placed Order ${orderRef} in your store.`,
      url: `/orders/${data.id}`
    }).catch(() => null)
  }

  return NextResponse.json({
    ok: true,
    orderId: data.id
  })
}

function getDisplayName(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : ""
  if (!normalized) {
    return "A buyer"
  }

  const firstName = normalized.split(/\s+/)[0] ?? normalized
  return firstName.length > 18 ? `${firstName.slice(0, 18)}…` : firstName
}

function getOrderRef(orderId: string) {
  return `#${orderId.slice(0, 6).toUpperCase()}`
}
