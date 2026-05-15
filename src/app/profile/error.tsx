"use client"

import { useEffect } from "react"

import { ErrorView } from "@/components/error-view"

export default function ProfileError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Profile route crashed", error)
  }, [error])

  return (
    <ErrorView
      title="Profile"
      message="We could not load your profile. Check your connection and try again."
      resetLabel="Reload profile"
      backHref="/"
      backLabel="Back to home"
      onReset={reset}
    />
  )
}
