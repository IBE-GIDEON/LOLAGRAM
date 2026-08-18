"use client"

import { useEffect, useState } from "react"

import { subscribeToMarketplaceUpdates } from "@/lib/marketplace"

/**
 * A counter that ticks whenever the catalogue is found to have changed
 * underneath the cached copy on screen.
 *
 * Put it in the dependency list of the effect that loads the data. The loader
 * re-runs, reads the freshly refreshed cache, and the seller's edit appears
 * without the buyer reloading anything.
 */
export function useMarketplaceRefresh() {
  const [token, setToken] = useState(0)

  useEffect(
    () => subscribeToMarketplaceUpdates(() => setToken((current) => current + 1)),
    []
  )

  return token
}
