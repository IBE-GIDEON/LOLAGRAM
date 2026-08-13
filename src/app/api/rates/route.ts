import { NextResponse } from "next/server"

import { BASE_CURRENCY, SUPPORTED_CURRENCY_CODES } from "@/lib/currency"

// Live rates: re-checked every minute rather than every six hours, so a price
// tracks the market as closely as the upstream publishes it. The window is not
// zero on purpose — one shared fetch a minute keeps a traffic spike from
// hammering the provider and getting the whole shop rate-limited into naira.
export const revalidate = 60

const RATES_ENDPOINT = `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`

type UpstreamResponse = {
  result?: string
  time_last_update_utc?: string
  rates?: Record<string, number>
}

/**
 * Exchange rates for display conversion, proxied so the browser never talks to
 * a third party and we control the cache. Returns rates: null on failure —
 * callers then show naira, which is always correct.
 */
export async function GET() {
  try {
    const response = await fetch(RATES_ENDPOINT, {
      next: { revalidate },
      headers: { accept: "application/json" }
    })

    if (!response.ok) {
      return ratesUnavailable()
    }

    const payload = (await response.json()) as UpstreamResponse

    if (payload.result !== "success" || !payload.rates) {
      return ratesUnavailable()
    }

    // Only ship the currencies we actually offer — a smaller payload on
    // mobile data, and nothing the switcher cannot select.
    const rates: Record<string, number> = {}
    for (const [code, value] of Object.entries(payload.rates)) {
      if (SUPPORTED_CURRENCY_CODES.has(code) && typeof value === "number") {
        rates[code] = value
      }
    }

    return NextResponse.json(
      {
        base: BASE_CURRENCY,
        rates,
        updatedAt: payload.time_last_update_utc ?? null
      },
      {
        headers: {
          "Cache-Control": `public, max-age=0, s-maxage=${revalidate}, stale-while-revalidate=300`
        }
      }
    )
  } catch {
    return ratesUnavailable()
  }
}

function ratesUnavailable() {
  return NextResponse.json(
    { base: BASE_CURRENCY, rates: null, updatedAt: null },
    {
      // Retry sooner than a success, but still shield the upstream.
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" }
    }
  )
}
