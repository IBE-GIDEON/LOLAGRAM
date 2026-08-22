import { NextResponse } from "next/server"

import { env, hasGooglePlaces } from "@/lib/env"
import { isCountryCode } from "@/lib/countries"

// Suggestions follow the keystrokes, so there is nothing worth caching.
export const dynamic = "force-dynamic"

const ENDPOINT = "https://places.googleapis.com/v1/places:autocomplete"

/**
 * Which Google place type each of our two fields asks for.
 *
 * administrative_area_level_1 is the state or province tier; locality is the
 * town or city. Asking for the precise tier is what stops a search for a city
 * offering streets and businesses.
 */
const PLACE_TYPES = {
  region: "administrative_area_level_1",
  city: "locality"
} as const

type Kind = keyof typeof PLACE_TYPES

/** Below two characters every query matches half a country. */
const MIN_INPUT = 2
const MAX_INPUT = 120

type UpstreamSuggestion = {
  placePrediction?: {
    structuredFormat?: {
      mainText?: { text?: string }
      secondaryText?: { text?: string }
    }
    text?: { text?: string }
  }
}

/**
 * Region and city lookup for the delivery address, proxied.
 *
 * The browser never talks to Google and never sees the key: a Maps browser key
 * is readable by anyone who opens the bundle, and this one stays on the server.
 *
 * Returns an empty list rather than an error whenever anything is wrong —
 * unconfigured, rate-limited, upstream down. The fields it feeds are ordinary
 * text inputs underneath, so a buyer can always simply type the answer, and a
 * failed lookup must never be what stops an order.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = (searchParams.get("input") ?? "").trim()
  const country = (searchParams.get("country") ?? "").trim().toUpperCase()
  const kind = (searchParams.get("kind") ?? "") as Kind

  if (!hasGooglePlaces) {
    return NextResponse.json({ suggestions: [], configured: false })
  }

  if (
    input.length < MIN_INPUT ||
    input.length > MAX_INPUT ||
    !isCountryCode(country) ||
    !(kind in PLACE_TYPES)
  ) {
    return NextResponse.json({ suggestions: [], configured: true })
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.googlePlacesApiKey
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: [PLACE_TYPES[kind]],
        // Confines results to the country already chosen on the form, so a
        // Nigerian address cannot be completed with a town in Texas.
        includedRegionCodes: [country.toLowerCase()],
        languageCode: "en"
      }),
      cache: "no-store"
    })

    if (!response.ok) {
      return NextResponse.json({ suggestions: [], configured: true })
    }

    const data = (await response.json()) as { suggestions?: UpstreamSuggestion[] }

    const suggestions = (data.suggestions ?? [])
      .map((entry) => {
        const prediction = entry.placePrediction
        const main =
          prediction?.structuredFormat?.mainText?.text ?? prediction?.text?.text ?? ""
        const secondary = prediction?.structuredFormat?.secondaryText?.text ?? ""
        return main ? { text: main, secondary } : null
      })
      .filter((entry): entry is { text: string; secondary: string } => entry !== null)
      .slice(0, 6)

    return NextResponse.json({ suggestions, configured: true })
  } catch {
    return NextResponse.json({ suggestions: [], configured: true })
  }
}
