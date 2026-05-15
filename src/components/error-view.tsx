"use client"

import Link from "next/link"

import { Button, Card, SectionHeading } from "@/components/ui"

export function ErrorView({
  title,
  message,
  resetLabel = "Try again",
  backHref = "/",
  backLabel = "Go home",
  onReset
}: {
  title: string
  message?: string
  resetLabel?: string
  backHref?: string
  backLabel?: string
  onReset?: () => void
}) {
  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <SectionHeading title={title} />
      <Card className="space-y-4 p-5">
        <div>
          <p className="text-lg font-semibold text-ink">Something went wrong</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {message ?? "An unexpected error occurred. Try again or go back."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {onReset ? (
            <Button className="flex-1" onClick={onReset}>
              {resetLabel}
            </Button>
          ) : null}
          <Link
            href={backHref}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:bg-canvas"
          >
            {backLabel}
          </Link>
        </div>
      </Card>
    </div>
  )
}
