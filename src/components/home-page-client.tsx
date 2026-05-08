"use client"

import { useEffect, useMemo, useState } from "react"
import { FiSearch } from "react-icons/fi"

import { Card, Input } from "@/components/ui"
import { VendorList } from "@/components/vendor-list"
import { hasSupabase } from "@/lib/env"
import { loadVendors } from "@/lib/marketplace"
import { type VendorSnapshot } from "@/lib/types"
import { cn } from "@/lib/utils"

type HomeTab = "find" | "general"

export function HomePageClient({
  searchOnly = false
}: {
  searchOnly?: boolean
}) {
  const [activeTab, setActiveTab] = useState<HomeTab>(searchOnly ? "find" : "general")
  const [query, setQuery] = useState("")
  const [vendors, setVendors] = useState<VendorSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => {
    const targetTab = searchOnly ? "find" : activeTab
    setLoading(true)

    loadVendors(targetTab === "find" ? query : "")
      .then((data) => setVendors(data))
      .finally(() => setLoading(false))
  }, [activeTab, query, searchOnly])

  useEffect(() => {
    setVisibleCount(20)
  }, [activeTab, query])

  const isFindTab = searchOnly || activeTab === "find"
  const displayedVendors = useMemo(() => {
    if (isFindTab) {
      return vendors
    }
    return vendors.slice(0, visibleCount)
  }, [isFindTab, vendors, visibleCount])

  const hasMore = !isFindTab && visibleCount < vendors.length

  return (
    <div className="px-4 pb-6 pt-3">
      <div className="sticky top-0 z-20 -mx-4 space-y-3 bg-canvas/95 px-4 pb-3 backdrop-blur">
        <Card className="overflow-hidden">
          <div className="flex items-start gap-3 px-4 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-chrome text-lg font-bold text-brand">
              L
            </div>
            <div className="min-w-0 flex-1">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
                  LOLAGRAM
                </p>
                <h1 className="mt-1 text-lg font-bold text-ink">
                  Browse vendors fast
                </h1>
              </div>
              <p className="mt-2 text-sm leading-5 text-muted">
                WhatsApp-style discovery for Nigerian shops, with direct ordering
                in a few taps.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
            <span className="rounded-full bg-brand/12 px-3 py-1 text-[11px] font-semibold text-ink">
              Mobile first
            </span>
            <span className="rounded-full bg-canvas px-3 py-1 text-[11px] text-muted">
              Installable PWA
            </span>
            <span className="rounded-full bg-canvas px-3 py-1 text-[11px] text-muted">
              Smooth vendor scrolling
            </span>
          </div>
        </Card>

        {!hasSupabase ? (
          <Card className="border border-brand/15 bg-brand/5 px-4 py-3 text-sm text-ink">
            Demo mode is active. The experience is fully navigable while you connect
            Supabase, Paystack, and push credentials.
          </Card>
        ) : null}

        {!searchOnly ? (
          <div className="grid grid-cols-2 rounded-full border border-border/70 bg-surface p-1 shadow-soft">
            {[
              { key: "find", label: "Find Vendors" },
              { key: "general", label: "General" }
            ].map((tab) => (
              <button
                key={tab.key}
                className={cn(
                  "rounded-full px-4 py-3 text-sm font-semibold transition",
                  activeTab === tab.key
                    ? "bg-chrome text-white"
                    : "text-muted hover:bg-canvas"
                )}
                onClick={() => setActiveTab(tab.key as HomeTab)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        <Card className="px-4 py-3">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              className="pl-11"
              placeholder={
                isFindTab
                  ? "Search store name or category"
                  : "Search or quick filter vendors"
              }
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {isFindTab
                ? "Real-time vendor discovery across store name, category, and city."
                : "All active vendors, sorted by most recent order activity first."}
            </p>
            <span className="shrink-0 rounded-full bg-canvas px-2.5 py-1 text-[11px] font-medium text-muted">
              {vendors.length} vendors
            </span>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-[82px] animate-pulse rounded-[24px] bg-surface shadow-soft"
            />
          ))}
        </div>
      ) : (
        <VendorList
          vendors={displayedVendors}
          showRating={!isFindTab}
          searchMode={isFindTab}
          hasMore={hasMore}
          onReachEnd={() =>
            setVisibleCount((current) => Math.min(current + 20, vendors.length))
          }
          className={cn(
            "mt-4",
            searchOnly ? "h-[calc(100vh-232px)]" : "h-[calc(100vh-308px)]"
          )}
        />
      )}
    </div>
  )
}
