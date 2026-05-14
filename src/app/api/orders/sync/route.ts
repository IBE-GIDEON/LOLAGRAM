import { NextResponse } from "next/server"

import { hasSupabaseAdmin } from "@/lib/env"
import { type CheckoutPayload } from "@/lib/types"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const payload = (await request.json()) as CheckoutPayload
  const supabase = getSupabaseAdminClient()

  if (!hasSupabaseAdmin || !supabase) {
    return NextResponse.json(
      { error: "Supabase admin configuration is missing for offline order sync." },
      { status: 503 }
    )
  }

  const { error } = await supabase.from("orders").insert({
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

  if (error) {
    const message = error.message.toLowerCase()
    if (
      message.includes("payment_method") ||
      message.includes("payment_status") ||
      message.includes("buyer_payment_note")
    ) {
      return NextResponse.json(
        { error: "Run the latest Supabase order-payment SQL patch, then sync again." },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
