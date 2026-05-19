"use client"

import { useEffect } from "react"

import { ErrorView } from "@/components/error-view"

export default function OrderDetailError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Order detail route crashed", error)
  }, [error])

  return (
    <ErrorView
      title="Order detail"
      message="This order could not be loaded. Check your connection and try again."
      resetLabel="Reload order"
      backHref="/orders"
      backLabel="Back to orders"
      onReset={reset}
    />
  )
}
