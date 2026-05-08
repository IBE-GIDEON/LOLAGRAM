import { NextResponse } from "next/server"

import { type CheckoutPayload } from "@/lib/types"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const payload = (await request.json()) as CheckoutPayload
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    return NextResponse.json({ ok: true, mode: "demo" })
  }

  const { error } = await supabase.from("orders").insert({
    buyer_id: payload.buyerId,
    vendor_id: payload.vendorId,
    items: payload.items,
    total_amount: payload.totalAmount,
    delivery_address: payload.deliveryAddress,
    status: "pending",
    paystack_reference: "offline-sync"
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
