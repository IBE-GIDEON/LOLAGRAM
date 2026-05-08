import crypto from "node:crypto"

import { env, hasPaystack } from "@/lib/env"

export async function initializePaystackTransaction(payload: {
  amount: number
  email: string
  reference: string
  callbackUrl: string
  metadata: Record<string, unknown>
}) {
  if (!hasPaystack) {
    return {
      status: true,
      data: {
        authorization_url: `${env.appUrl}${payload.callbackUrl}`,
        reference: payload.reference
      }
    }
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: Math.round(payload.amount * 100),
      email: payload.email,
      reference: payload.reference,
      callback_url: payload.callbackUrl,
      metadata: payload.metadata,
      currency: "NGN"
    })
  })

  if (!response.ok) {
    throw new Error("Unable to initialize Paystack checkout")
  }

  return (await response.json()) as {
    status: boolean
    data: {
      authorization_url: string
      reference: string
    }
  }
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!hasPaystack) {
    return true
  }

  if (!signature) {
    return false
  }

  const hash = crypto
    .createHmac("sha512", env.paystackSecretKey)
    .update(rawBody)
    .digest("hex")

  return hash === signature
}
