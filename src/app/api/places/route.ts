import { NextResponse } from "next/server"

import { isCountryCode } from "@/lib/countries"
import citiesByCountry from "@/lib/geo/cities.json"
import statesByCountry from "@/lib/geo/states.json"

const DATA: Record<"region" | "city", Record<string, string[]>> = {
  region: statesByCountry as Record<string, string[]>,
  city: citiesByCountry as Record<string, string[]>
}

type Kind = keyof typeof DATA

/**
 * The whole list of states, or of cities, for one country.
 *
 * Sent once and filtered in the browser rather than searched here on every
 * keystroke. A round trip per letter is what made these fields feel slow next
 * to the country box, which is a plain select and answers instantly because
 * its options are already on the page.
 *
 * The payload is small enough for that: Nigeria's 491 cities are five
 * kilobytes, the median country is one, and the largest in the world is under
 * two hundred — fetched once per country and then cached.
 *
 * The lists only change when the app is deployed, so they cache hard.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const country = (searchParams.get("country") ?? "").trim().toUpperCase()
  const kind = (searchParams.get("kind") ?? "") as Kind

  if (!isCountryCode(country) || !(kind in DATA)) {
    return NextResponse.json({ items: [] })
  }

  return NextResponse.json(
    { items: DATA[kind][country] ?? [] },
    {
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800"
      }
    }
  )
}
