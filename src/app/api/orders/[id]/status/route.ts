import { NextResponse } from "next/server"

import { sendPushNotification } from "@/lib/push"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type OrderStatus } from "@/lib/types"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { status } = (await request.json()) as { status: OrderStatus }
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    return NextResponse.json({ ok: true, status })
  }

  const { data: order, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", params.id)
    .select()
    .single()

  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? "Order not found" }, { status: 500 })
  }

  void sendPushNotification({
    userId: String(order.buyer_id),
    title:
      status === "confirmed"
        ? "Your LOLAGRAM order is confirmed"
        : status === "dispatched"
          ? "Your LOLAGRAM order is on the way"
          : "Your LOLAGRAM order has been delivered",
    body:
      status === "confirmed"
        ? "The seller confirmed your order."
        : status === "dispatched"
          ? "The seller has dispatched your items."
          : "Your seller marked this order as delivered.",
    url: `/orders/${params.id}`
  }).catch(() => {
    return null
  })

  return NextResponse.json({ ok: true })
}
