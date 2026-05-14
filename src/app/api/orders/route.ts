import { NextResponse } from "next/server"

import { hasSupabaseAdmin } from "@/lib/env"
import { sendPushNotification } from "@/lib/push"
import { type CheckoutPayload } from "@/lib/types"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const payload = (await request.json()) as CheckoutPayload
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

  if (vendor?.user_id) {
    void sendPushNotification({
      userId: String(vendor.user_id),
      title: "New Order on LOLAGRAM",
      body: `${payload.items[0]?.name ?? "A buyer"} just placed an order in your store.`,
      url: `/orders/${data.id}`
    }).catch(() => null)
  }

  return NextResponse.json({
    ok: true,
    orderId: data.id
  })
}
