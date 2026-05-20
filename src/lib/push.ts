import webpush from "web-push"

import { env, hasWebPush } from "@/lib/env"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

let configured = false

function ensureWebPush() {
  if (!hasWebPush || configured) {
    return
  }

  webpush.setVapidDetails(
    "mailto:hello@glowgram.app",
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

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", input.userId)

  if (error) {
    console.error("[push] Could not load subscriptions", {
      userId: input.userId,
      error: error.message
    })
    return
  }

  if (!subscriptions?.length) {
    console.info("[push] No subscriptions found for user", {
      userId: input.userId
    })
    return
  }

  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    url: input.url
  })

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          payload
        )
      } catch (error) {
        const pushError = error as Error & { statusCode?: number; body?: string }
        const statusCode = pushError.statusCode

        console.error("[push] Delivery failed", {
          userId: input.userId,
          subscriptionId: subscription.id,
          statusCode,
          message: pushError.message,
          body: pushError.body
        })

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id)
        }

        throw error
      }
    })
  )

  const failed = results.filter((result) => result.status === "rejected").length
  if (failed > 0) {
    console.error("[push] Notification finished with failures", {
      userId: input.userId,
      failed,
      total: subscriptions.length
    })
  }
}
