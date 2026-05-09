"use client"

import { useEffect } from "react"

import { flushOfflineOrders } from "@/lib/offline-orders"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister()))
        )
        .catch(() => undefined)
      return
    }

    navigator.serviceWorker.register("/sw.js").catch(() => undefined)

    const flush = () => {
      flushOfflineOrders().catch(() => undefined)
    }

    window.addEventListener("online", flush)
    flush()

    return () => window.removeEventListener("online", flush)
  }, [])

  return null
}
