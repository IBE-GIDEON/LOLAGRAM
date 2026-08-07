"use client"

import Link from "next/link"

import { Card, SectionHeading } from "@/components/ui"

/**
 * Shown on the seller routes while store signups are closed. The routes stay in
 * the app — they just stop handing a storefront to anyone who types the URL.
 */
export function SellerClosedNotice({
  title = "Seller onboarding"
}: {
  title?: string
}) {
  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <SectionHeading title={title} />
      <Card className="p-5">
        <p className="text-lg font-semibold text-ink">
          Selling is not open yet
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          GLOWGRAM is running with a single store for now. We will open store
          signups once buyers start asking for more sellers.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-full bg-chrome px-4 py-3 text-sm font-semibold text-white"
        >
          Back to shopping
        </Link>
      </Card>
    </div>
  )
}
