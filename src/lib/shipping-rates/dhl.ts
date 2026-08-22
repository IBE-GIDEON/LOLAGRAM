import { env } from "@/lib/env"
import { type RateProvider, type RateRequest, type RateResult } from "./types"

/**
 * DHL Express, through MyDHL API.
 *
 * Rates are account-specific — DHL quotes the price negotiated against the
 * account number, so there is no generic price list to read. Credentials come
 * from the DHL developer portal once an Express account exists.
 *
 * Keys are read on the server only. A DHL key in the browser bundle would be
 * anyone's to spend.
 */
const RATES_URL = "https://express.api.dhl.com/mydhlapi/rates"
const TEST_RATES_URL = "https://express.api.dhl.com/mydhlapi/test/rates"

/** A carrier being slow must not hold up a checkout page. */
const TIMEOUT_MS = 8000

export const dhlProvider: RateProvider = {
  id: "dhl",

  isConfigured() {
    return Boolean(
      env.dhlApiKey && env.dhlApiSecret && env.dhlAccountNumber
    )
  },

  async quote(request: RateRequest): Promise<RateResult> {
    if (!this.isConfigured()) {
      return { ok: false, reason: "DHL keys are not set." }
    }

    // DHL wants a shipping date, not a timestamp, and refuses one in the past.
    // Tomorrow avoids both a cut-off and a timezone argument.
    const shipDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    const body = {
      customerDetails: {
        shipperDetails: toDhlAddress(request.origin),
        receiverDetails: toDhlAddress(request.destination)
      },
      accounts: [{ typeCode: "shipper", number: env.dhlAccountNumber }],
      plannedShippingDateAndTime: `${shipDate}T10:00:00GMT+01:00`,
      unitOfMeasurement: "metric",
      isCustomsDeclarable: request.origin.countryCode !== request.destination.countryCode,
      packages: [
        {
          weight: Math.max(0.1, Number(request.weightKg.toFixed(3))),
          dimensions: {
            length: Math.max(1, Math.round(request.lengthCm)),
            width: Math.max(1, Math.round(request.widthCm)),
            height: Math.max(1, Math.round(request.heightCm))
          }
        }
      ]
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(
        env.dhlUseTestEnvironment ? TEST_RATES_URL : RATES_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Basic auth over key:secret, per the MyDHL API guide.
            Authorization: `Basic ${Buffer.from(
              `${env.dhlApiKey}:${env.dhlApiSecret}`
            ).toString("base64")}`
          },
          body: JSON.stringify(body),
          signal: controller.signal,
          cache: "no-store"
        }
      )

      if (!response.ok) {
        const detail = await response.text().catch(() => "")
        return {
          ok: false,
          reason: `DHL replied ${response.status}. ${detail.slice(0, 200)}`
        }
      }

      const data = (await response.json()) as DhlRatesResponse

      // Cheapest product DHL is willing to carry it on.
      let best: { amount: number; currency: string; name?: string } | null = null

      for (const product of data.products ?? []) {
        for (const price of product.totalPrice ?? []) {
          const amount = Number(price.price)
          if (!Number.isFinite(amount) || amount <= 0) continue
          if (!best || amount < best.amount) {
            best = {
              amount,
              currency: String(price.priceCurrency ?? "NGN"),
              name: product.productName
            }
          }
        }
      }

      if (!best) {
        return { ok: false, reason: "DHL returned no priced service for that route." }
      }

      return {
        ok: true,
        amount: Math.round(best.amount * 100) / 100,
        currency: best.currency,
        serviceName: best.name
      }
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError"
      return {
        ok: false,
        reason: aborted
          ? "DHL did not answer in time."
          : `DHL request failed: ${error instanceof Error ? error.message : "unknown"}`
      }
    } finally {
      clearTimeout(timer)
    }
  }
}

type DhlRatesResponse = {
  products?: Array<{
    productName?: string
    totalPrice?: Array<{ price?: unknown; priceCurrency?: unknown }>
  }>
}

function toDhlAddress(address: { countryCode: string; city: string; postalCode?: string }) {
  return {
    postalAddress: {
      cityName: address.city,
      countryCode: address.countryCode,
      // Nigeria does not use postcodes the way DHL expects; sending a blank
      // one is better than sending a made-up one.
      ...(address.postalCode ? { postalCode: address.postalCode } : {})
    }
  }
}
