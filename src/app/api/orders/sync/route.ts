import { NextResponse } from "next/server"

import { hasSupabaseAdmin } from "@/lib/env"
import { verifyAuthToken } from "@/lib/supabase/auth-guard"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type CheckoutPayload } from "@/lib/types"

export async function POST(request: Request) {
  // Require a valid Supabase session for offline order sync
  const user = await verifyAuthToken(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json()) as CheckoutPayload

  // Prevent replaying another user's offline order
  if (payload.buyerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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
