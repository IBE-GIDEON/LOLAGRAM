import crypto from "node:crypto"

import { env, hasFlutterwave } from "@/lib/env"

const API = "https://api.flutterwave.com/v3"

/**
 * Opens a Flutterwave hosted checkout and returns the link to send the buyer to.
 *
 * Amount is in naira, not kobo. Paystack took the minor unit and Flutterwave
 * takes the major one, so the same number means a hundredfold difference
 * between the two — this is the single most dangerous detail in the migration.
 */
export async function createFlutterwavePayment(payload: {
  amount: number
  email: string
  name?: string
  phone?: string
  txRef: string
  redirectUrl: string
  meta: Record<string, unknown>
}) {
  const response = await fetch(`${API}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.flutterwaveSecretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tx_ref: payload.txRef,
      amount: payload.amount,
      currency: "NGN",
      redirect_url: payload.redirectUrl,
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: payload.email,
        name: payload.name,
        phonenumber: payload.phone
      },
      customizations: {
        title: "Afunwa Hairline Global",
        description: "Wigs, closures, frontals and bundles"
      },
      meta: payload.meta
    })
  })

  const body = (await response.json().catch(() => null)) as {
    status?: string
    message?: string
    data?: { link?: string }
  } | null

  if (!response.ok || body?.status !== "success" || !body.data?.link) {
    throw new Error(body?.message ?? "Unable to start Flutterwave checkout")
  }

  return { checkoutUrl: body.data.link }
}

/**
 * Re-reads a transaction from Flutterwave.
 *
 * The webhook body is never trusted for money on its own: Flutterwave's own
 * guidance is to confirm against this endpoint before releasing anything,
 * because the payload is only as trustworthy as the secret hash behind it.
 */
export async function verifyFlutterwaveTransaction(transactionId: string | number) {
  const response = await fetch(`${API}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${env.flutterwaveSecretKey}` }
  })

  const body = (await response.json().catch(() => null)) as {
    status?: string
    data?: {
      status?: string
      amount?: number
      currency?: string
      tx_ref?: string
    }
  } | null

  if (!response.ok || body?.status !== "success" || !body.data) {
    return null
  }

  return body.data
}

/**
 * Flutterwave sends the secret hash verbatim in `verif-hash` — it is a shared
 * secret, not an HMAC of the body as Paystack used. Compared in constant time
 * so a wrong guess cannot be narrowed down by timing.
 */
export function verifyFlutterwaveSignature(signature: string | null) {
  if (!hasFlutterwave || !env.flutterwaveSecretHash) {
    // No hash configured means nothing can be trusted, so nothing is accepted.
    return false
  }

  if (!signature) return false

  const expected = Buffer.from(env.flutterwaveSecretHash)
  const received = Buffer.from(signature)

  if (expected.length !== received.length) return false
  return crypto.timingSafeEqual(expected, received)
}
