import { NextResponse } from "next/server"

import { getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = getSupabaseAdminClient()

  if (!supabase || !body?.userId || !body?.subscription?.endpoint) {
    return NextResponse.json({ ok: true })
  }

  const subscription = body.subscription

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: body.userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys?.p256dh,
    auth: subscription.keys?.auth
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
