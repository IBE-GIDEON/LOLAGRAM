import { NextResponse } from "next/server"

import { verifyAuthToken } from "@/lib/supabase/auth-guard"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  // Verify the caller is signed in before storing a push subscription.
  // Without this check, anyone could subscribe a victim's userId to their
  // own device and receive that user's private order notifications.
  const user = await verifyAuthToken(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const supabase = getSupabaseAdminClient()

  if (!supabase || !body?.subscription?.endpoint) {
    return NextResponse.json({ ok: true })
  }

  // Always use the verified user's ID — ignore any userId sent in the body.
  const subscription = body.subscription

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh,
      auth: subscription.keys?.auth
    },
    { onConflict: "endpoint" }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
