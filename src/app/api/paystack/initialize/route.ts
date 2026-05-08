import { NextResponse } from "next/server"

import { env, hasPaystack } from "@/lib/env"
import { initializePaystackTransaction } from "@/lib/paystack"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type CheckoutPayload } from "@/lib/types"
import { createPaystackReference } from "@/lib/utils"

export async function POST(request: Request) {
  const payload = (await request.json()) as CheckoutPayload
  const supabase = getSupabaseAdminClient()
  const reference = createPaystackReference()

  if (!supabase || !hasPaystack) {
    return NextResponse.json({
      checkoutUrl: `${env.appUrl}/order-confirmation/demo-${reference}`,
      orderId: `demo-${reference}`,
      reference
    })
  }

  const { data: order, error } = await supabase
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

  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? "Unable to create order" }, { status: 500 })
  }

  const transaction = await initializePaystackTransaction({
    amount: payload.totalAmount,
    email: `buyer-${payload.buyerId.slice(0, 8)}@lolagram.app`,
    reference,
    callbackUrl: `${env.appUrl}/order-confirmation/${order.id}`,
    metadata: {
      order_id: order.id,
      vendor_id: payload.vendorId,
      buyer_id: payload.buyerId
    }
  })

  return NextResponse.json({
    checkoutUrl: transaction.data.authorization_url,
    orderId: order.id,
    reference
  })
}
