"use client"

import { useEffect } from "react"

import { ErrorView } from "@/components/error-view"

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled app error", error)
  }, [error])

  return (
    <ErrorView
      title="Something went wrong"
      message="An unexpected error occurred. Try refreshing the page."
      resetLabel="Try again"
      backHref="/"
      backLabel="Back to home"
      onReset={reset}
    />
  )
}
