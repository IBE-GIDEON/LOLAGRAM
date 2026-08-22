import crypto from "node:crypto"

import { BASE_CURRENCY } from "@/lib/currency"
import { env, hasPayPal } from "@/lib/env"

const LIVE_API = "https://api-m.paypal.com"
const SANDBOX_API = "https://api-m.sandbox.paypal.com"

function api() {
  return env.paypalEnvironment === "sandbox" ? SANDBOX_API : LIVE_API
}

/**
 * PayPal does not settle in naira.
 *
 * NGN is not among the currencies PayPal accepts, so an order priced in naira
 * has to be presented in one it does take. The rate comes from the same feed
 * the shop already displays prices with, so a buyer is charged what the
 * currency switcher told them, not a second private rate.
 */
export const PAYPAL_CURRENCY = "USD"

const RATES_ENDPOINT = `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`

/** Naira to PayPal's currency, at the rate the shop is quoting today. */
export async function convertFromBaseCurrency(amountInBase: number) {
  const response = await fetch(RATES_ENDPOINT, {
    // One shared fetch a minute, matching /api/rates.
    next: { revalidate: 60 },
    headers: { accept: "application/json" }
  })

  if (!response.ok) {
    throw new Error("Could not read the exchange rate for PayPal.")
  }

  const body = (await response.json()) as { rates?: Record<string, number> }
  const rate = Number(body.rates?.[PAYPAL_CURRENCY])

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("No usable exchange rate for PayPal.")
  }

  // Rounded up to the cent: rounding down would collect fractionally less than
  // the order is worth, every single time.
  return {
    amount: Math.ceil(amountInBase * rate * 100) / 100,
    currency: PAYPAL_CURRENCY,
    rate
  }
}

async function accessToken() {
  const response = await fetch(`${api()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${env.paypalClientId}:${env.paypalClientSecret}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials",
    cache: "no-store"
  })

  const body = (await response.json().catch(() => null)) as {
    access_token?: string
    error_description?: string
  } | null

  if (!response.ok || !body?.access_token) {
    throw new Error(body?.error_description ?? "PayPal rejected the credentials.")
  }

  return body.access_token
}

/**
 * Opens a PayPal checkout and returns the link to send the buyer to.
 *
 * intent CAPTURE, so approving on PayPal's side takes the money rather than
 * merely authorising it — the same shape as the Flutterwave hosted page.
 */
export async function createPayPalOrder(payload: {
  amount: number
  currency: string
  orderId: string
  returnUrl: string
  cancelUrl: string
}) {
  const token = await accessToken()

  const response = await fetch(`${api()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          // Our own order id, so the webhook can find the row again.
          custom_id: payload.orderId,
          amount: {
            currency_code: payload.currency,
            value: payload.amount.toFixed(2)
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Afunwa Hairline Global",
            user_action: "PAY_NOW",
            return_url: payload.returnUrl,
            cancel_url: payload.cancelUrl
          }
        }
      }
    }),
    cache: "no-store"
  })

  const body = (await response.json().catch(() => null)) as {
    id?: string
    links?: Array<{ rel?: string; href?: string }>
    message?: string
  } | null

  const approve = body?.links?.find((link) => link.rel === "payer-action")?.href
    ?? body?.links?.find((link) => link.rel === "approve")?.href

  if (!response.ok || !body?.id || !approve) {
    throw new Error(body?.message ?? "Unable to start PayPal checkout.")
  }

  return { checkoutUrl: approve, paypalOrderId: body.id }
}

/**
 * Re-reads an order from PayPal.
 *
 * The webhook body is never trusted for money on its own, for the same reason
 * Flutterwave's is not: what PayPal's own API says happened is the authority.
 */
export async function readPayPalOrder(paypalOrderId: string) {
  const token = await accessToken()

  const response = await fetch(`${api()}/v2/checkout/orders/${paypalOrderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  })

  const body = (await response.json().catch(() => null)) as {
    id?: string
    status?: string
    purchase_units?: Array<{
      custom_id?: string
      payments?: {
        captures?: Array<{
          status?: string
          amount?: { currency_code?: string; value?: string }
        }>
      }
    }>
  } | null

  if (!response.ok || !body?.id) return null
  return body
}

/**
 * Confirms a webhook really came from PayPal.
 *
 * PayPal signs with a certificate rather than a shared secret, and offers an
 * endpoint that does the checking. Without PAYPAL_WEBHOOK_ID there is nothing
 * to check against, so nothing is accepted — the same rule as the Flutterwave
 * hash.
 */
export async function verifyPayPalWebhook(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  if (!hasPayPal || !env.paypalWebhookId) return false

  const transmissionId = headers.get("paypal-transmission-id")
  const transmissionTime = headers.get("paypal-transmission-time")
  const certUrl = headers.get("paypal-cert-url")
  const authAlgo = headers.get("paypal-auth-algo")
  const transmissionSig = headers.get("paypal-transmission-sig")

  if (
    !transmissionId ||
    !transmissionTime ||
    !certUrl ||
    !authAlgo ||
    !transmissionSig
  ) {
    return false
  }

  try {
    const token = await accessToken()

    const response = await fetch(
      `${api()}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: authAlgo,
          transmission_sig: transmissionSig,
          webhook_id: env.paypalWebhookId,
          // Must be the parsed event, not the string — PayPal re-serialises it.
          webhook_event: JSON.parse(rawBody)
        }),
        cache: "no-store"
      }
    )

    const body = (await response.json().catch(() => null)) as {
      verification_status?: string
    } | null

    return response.ok && body?.verification_status === "SUCCESS"
  } catch {
    return false
  }
}

/** A reference PayPal will accept and we can trace back. */
export function buildPayPalReference(orderId: string) {
  return `afunwa-${orderId}-${crypto.randomBytes(4).toString("hex")}`
}
