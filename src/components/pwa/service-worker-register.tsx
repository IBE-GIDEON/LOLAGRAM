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

    const hadController = Boolean(navigator.serviceWorker.controller)
    let controllerReloaded = false
    let updateInterval: ReturnType<typeof setInterval> | null = null

    const reloadOnControllerChange = () => {
      if (!hadController) return
      if (controllerReloaded) return
      controllerReloaded = true
      window.location.reload()
    }

    const checkForUpdate = async (registration?: ServiceWorkerRegistration) => {
      try {
        const activeRegistration =
          registration ?? (await navigator.serviceWorker.getRegistration())
        await activeRegistration?.update()
      } catch (error) {
        // Update checks should never interrupt app usage.
      }
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      reloadOnControllerChange
    )

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        void checkForUpdate(registration)
        updateInterval = setInterval(() => {
          void checkForUpdate(registration)
        }, 15 * 60 * 1000)
      })
      .catch(() => undefined)

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdate()
      }
    }
    const checkForUpdateFromFocus = () => {
      void checkForUpdate()
    }

    const flush = () => {
      flushOfflineOrders().catch(() => undefined)
    }

    // Background sync fires in the worker, which has no access to the session,
    // so it asks us to do the flush instead.
    const onWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "FLUSH_OFFLINE_ORDERS") flush()
    }

    window.addEventListener("online", flush)
    window.addEventListener("focus", checkForUpdateFromFocus)
    document.addEventListener("visibilitychange", refreshWhenVisible)
    navigator.serviceWorker.addEventListener("message", onWorkerMessage)
    flush()

    return () => {
      window.removeEventListener("online", flush)
      window.removeEventListener("focus", checkForUpdateFromFocus)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        reloadOnControllerChange
      )
      navigator.serviceWorker.removeEventListener("message", onWorkerMessage)
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    }
  }, [])

  return null
}
