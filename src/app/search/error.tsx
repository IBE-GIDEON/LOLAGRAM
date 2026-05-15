"use client"

import { useEffect } from "react"

import { ErrorView } from "@/components/error-view"

export default function SearchError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Search route crashed", error)
  }, [error])

  return (
    <ErrorView
      title="Search"
      message="Search encountered an error. Try again or return home."
      resetLabel="Retry search"
      backHref="/"
      backLabel="Back to home"
      onReset={reset}
    />
  )
}
