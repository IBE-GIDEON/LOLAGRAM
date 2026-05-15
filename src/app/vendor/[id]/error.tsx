"use client"

import { useEffect } from "react"

import { ErrorView } from "@/components/error-view"

export default function VendorError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Vendor store route crashed", error)
  }, [error])

  return (
    <ErrorView
      title="Store"
      message="We could not load this store. It may have been removed or the connection dropped."
      resetLabel="Reload store"
      backHref="/"
      backLabel="Back to home"
      onReset={reset}
    />
  )
}
