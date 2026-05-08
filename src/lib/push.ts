import webpush from "web-push"

import { env, hasWebPush } from "@/lib/env"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

let configured = false

function ensureWebPush() {
  if (!hasWebPush || configured) {
    return
  }

  webpush.setVapidDetails(
    "mailto:hello@lolagram.app",
    env.vapidPublicKey,
    env.vapidPrivateKey
  )
  configured = true
}

export async function sendPushNotification(input: {
  userId: string
  title: string
  body: string
  url?: string
}) {
  if (!hasWebPush) {
    return
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) {
    return
  }

  ensureWebPush()

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", input.userId)

  await Promise.allSettled(
    (subscriptions ?? []).map((subscription) =>
      webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        },
        JSON.stringify({
          title: input.title,
          body: input.body,
          url: input.url
        })
      )
    )
  )
}
