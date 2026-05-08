"use client"

import { useEffect, useMemo, useState } from "react"
import { FiSearch } from "react-icons/fi"

import { Input } from "@/components/ui"
import { VendorList } from "@/components/vendor-list"
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
  const pageTitle = searchOnly ? "Search" : "Lolagram"
  const filteredVendors = useMemo(() => {
    if (isFindTab || !query.trim()) {
      return vendors
    }

    const normalizedQuery = query.trim().toLowerCase()

    return vendors.filter((vendor) =>
      [vendor.storeName, vendor.category, vendor.city].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    )
  }, [isFindTab, query, vendors])

  const displayedVendors = useMemo(() => {
    const source = isFindTab ? vendors : filteredVendors

    if (isFindTab) {
      return source
    }
    return source.slice(0, visibleCount)
  }, [filteredVendors, isFindTab, vendors, visibleCount])

  const visibleVendorCount = isFindTab ? vendors.length : filteredVendors.length
  const hasMore = !isFindTab && visibleCount < filteredVendors.length

  return (
    <div className="px-4 pb-6 pt-3">
      <div className="sticky top-0 z-20 -mx-4 overflow-hidden rounded-b-[32px] bg-brand px-4 pb-4 text-chrome shadow-[0_16px_36px_rgba(0,0,0,0.12)] backdrop-blur dark:bg-chrome dark:text-white dark:shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
        <div className="pt-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[44px] font-bold leading-none tracking-[-0.05em]">
              {pageTitle}
            </h1>
            <span className="rounded-full border border-black/10 bg-white/45 px-3 py-1.5 text-[11px] font-semibold text-chrome/80 dark:border-white/10 dark:bg-white/10 dark:text-white/75">
              {visibleVendorCount} vendors
            </span>
          </div>

          <div className="relative mt-4 flex-1">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted dark:text-white/55" />
            <Input
              className="border-black/5 bg-white/90 pl-11 text-ink placeholder:text-muted focus:border-chrome/10 focus:ring-black/5 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:focus:border-brand/50 dark:focus:ring-brand/15"
              placeholder={
                isFindTab
                  ? "Search store name or category"
                  : "Search vendors or filter by city"
              }
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {!searchOnly ? (
              <div className="grid flex-1 grid-cols-2 gap-2">
                {[
                  { key: "general", label: "General" },
                  { key: "find", label: "Find Vendors" }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={cn(
                      "rounded-full border px-4 py-3 text-center text-sm font-semibold transition",
                      activeTab === tab.key
                        ? "border-transparent bg-chrome text-white dark:bg-brand dark:text-chrome"
                        : "border-black/10 bg-white/35 text-chrome/78 hover:bg-white/50 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
                    )}
                    onClick={() => setActiveTab(tab.key as HomeTab)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <span className="rounded-full border border-black/10 bg-white/35 px-4 py-2 text-sm font-medium text-chrome/78 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                Live search
              </span>
            )}
          </div>
        </div>
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
            setVisibleCount((current) =>
              Math.min(current + 20, filteredVendors.length)
            )
          }
          className={cn(
            "mt-3",
            searchOnly ? "h-[calc(100dvh-236px)]" : "h-[calc(100dvh-284px)]"
          )}
        />
      )}
    </div>
  )
}
