"use client"

import Link from "next/link"
import { useEffect } from "react"

import { Button, Card, SectionHeading } from "@/components/ui"

export default function OrdersError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Orders route crashed", error)
  }, [error])

  const refreshOrders = () => {
    try {
      const rawStore = window.localStorage.getItem("lolagram-persisted-cache-v1")
      const store = rawStore ? (JSON.parse(rawStore) as Record<string, unknown>) : {}

      for (const key of Object.keys(store)) {
        if (
          key.startsWith("buyer-orders:") ||
          key.startsWith("seller-orders:") ||
          key.startsWith("order-detail:")
        ) {
          delete store[key]
        }
      }

      window.localStorage.setItem("lolagram-persisted-cache-v1", JSON.stringify(store))
    } catch {
      // If local storage is unavailable, retrying the route is still safe.
    }

    reset()
  }

  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <SectionHeading title="Orders" />
      <Card className="space-y-4 p-5">
        <div>
          <p className="text-lg font-semibold text-ink">We could not open this order yet</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Refresh the order data and try again. If this keeps happening, the
            live database may be missing the latest order-payment columns or policies.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={refreshOrders}>
            Refresh orders
          </Button>
          <Link
            href="/orders"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:bg-canvas"
          >
            Back to orders
          </Link>
        </div>
      </Card>
    </div>
  )
}
