"use client"

import { useEffect } from "react"

import { flushOfflineOrders } from "@/lib/offline-orders"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
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
