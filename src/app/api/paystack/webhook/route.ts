import { NextResponse } from "next/server"

import { sendPushNotification } from "@/lib/push"
import { verifyPaystackSignature } from "@/lib/paystack"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature")

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(rawBody) as {
    event: string
    data?: {
      reference?: string
      metadata?: {
        order_id?: string
      }
    }
  }

  if (event.event !== "charge.success" || !event.data?.metadata?.order_id) {
    return NextResponse.json({ ok: true })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return NextResponse.json({ ok: true })
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*, vendor_profiles(user_id)")
    .eq("id", event.data.metadata.order_id)
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ ok: true })
  }

  await supabase
    .from("orders")
    .update({ paystack_reference: event.data.reference ?? order.paystack_reference })
    .eq("id", event.data.metadata.order_id)

  const vendorUserId =
    order.vendor_profiles && "user_id" in order.vendor_profiles
      ? String(order.vendor_profiles.user_id)
      : null

  if (vendorUserId) {
    await sendPushNotification({
      userId: vendorUserId,
      title: "New Order on LOLAGRAM",
      body: "A buyer just ordered from your store.",
      url: `/orders/${order.id}`
    })
  }

  return NextResponse.json({ ok: true })
}
