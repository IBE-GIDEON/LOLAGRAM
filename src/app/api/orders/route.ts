import { NextResponse } from "next/server"

import { hasSupabaseAdmin } from "@/lib/env"
import { type CheckoutPayload } from "@/lib/types"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { createPaystackReference } from "@/lib/utils"

export async function POST(request: Request) {
  const payload = (await request.json()) as CheckoutPayload
  const supabase = getSupabaseAdminClient()

  if (!hasSupabaseAdmin || !supabase) {
    return NextResponse.json(
      { error: "Supabase admin configuration is missing for order creation." },
      { status: 503 }
    )
  }

  const reference = createPaystackReference()
  const { data, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: payload.buyerId,
      vendor_id: payload.vendorId,
      items: payload.items,
      total_amount: payload.totalAmount,
      delivery_address: payload.deliveryAddress,
      status: "pending",
      paystack_reference: reference
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    orderId: data.id,
    reference
  })
}
