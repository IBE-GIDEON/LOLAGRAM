"use client"

import { useEffect, useMemo, useState } from "react"
import { FiCamera, FiMoreHorizontal, FiPlus, FiSearch } from "react-icons/fi"

import { VendorList } from "@/components/vendor-list"
import { hasSupabase } from "@/lib/env"
import { loadVendors } from "@/lib/marketplace"
import { type VendorSnapshot } from "@/lib/types"
import { cn } from "@/lib/utils"

type HomeTab = "all" | "find"

export function HomePageClient({
  searchOnly = false
}: {
  searchOnly?: boolean
}) {
  const [activeTab, setActiveTab] = useState<HomeTab>(searchOnly ? "find" : "all")
  const [query, setQuery] = useState("")
  const [vendors, setVendors] = useState<VendorSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => {
    const isFindMode = searchOnly || activeTab === "find"
    setLoading(true)
    loadVendors(isFindMode ? query : "")
      .then((data) => setVendors(data))
      .finally(() => setLoading(false))
  }, [activeTab, query, searchOnly])

  useEffect(() => {
    setVisibleCount(20)
  }, [activeTab, query])

  const isFindTab = searchOnly || activeTab === "find"
  const displayedVendors = useMemo(() => {
    if (isFindTab) return vendors
    return vendors.slice(0, visibleCount)
  }, [isFindTab, vendors, visibleCount])

  const hasMore = !isFindTab && visibleCount < vendors.length

  const pills: { key: HomeTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "find", label: "Find Vendors" },
  ]

  return (
    <div className="pb-6">
      {/* WhatsApp-style sticky header */}
      <div className="sticky top-0 z-20 -mx-4 bg-canvas/95 px-4 pb-3 backdrop-blur">

        {/* Top action bar */}
        <div className="flex items-center justify-between pt-3 pb-1">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink">
            <FiMoreHorizontal size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink">
              <FiCamera size={18} />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white">
              <FiPlus size={20} />
            </button>
          </div>
        </div>

        {/* Large title */}
        <h1 className="mb-3 text-[32px] font-bold leading-tight text-ink">
          Lolagram
        </h1>

        {/* Demo mode banner */}
        {!hasSupabase ? (
          <div className="mb-3 rounded-2xl border border-brand/15 bg-brand/5 px-4 py-2.5 text-xs text-ink">
            Demo mode active — connect Supabase, Paystack &amp; push credentials to go live.
          </div>
        ) : null}

        {/* Search bar */}
        <div className="relative mb-3">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            className="w-full rounded-full bg-surface py-3 pl-11 pr-4 text-sm text-ink placeholder:text-muted focus:outline-none"
            placeholder={isFindTab ? "Search store name or category" : "Ask Meta AI or Search"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filter pills */}
        {!searchOnly ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setActiveTab(pill.key)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition",
                  activeTab === pill.key
                    ? "bg-brand text-white"
                    : "bg-surface text-muted"
                )}
              >
                {pill.label}
              </button>
            ))}
            <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted text-sm font-bold">
              +
            </button>
          </div>
        ) : null}
      </div>

      {/* Vendor list */}
      {loading ? (
        <div className="mt-4 space-y-3 px-4">
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
            "mt-2 px-4",
            searchOnly ? "h-[calc(100vh-200px)]" : "h-[calc(100vh-280px)]"
          )}
        />
      )}
    </div>
  )
}
