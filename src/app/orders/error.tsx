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

  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <SectionHeading title="Orders" />
      <Card className="space-y-4 p-5">
        <div>
          <p className="text-lg font-semibold text-ink">We could not open this order yet</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            The app hit stale order data on this device. Try reloading this screen,
            then open the order again.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={reset}>
            Try again
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
