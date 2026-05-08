"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { FiPlus, FiSearch, FiUser } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui"
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
  const { sessionUserId, vendorProfile } = useAuth()
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
  const sellerHref = vendorProfile
    ? "/seller/products"
    : sessionUserId
      ? "/onboarding/seller"
      : "/profile"
  const sellerLabel = vendorProfile
    ? "Manage your store products"
    : sessionUserId
      ? "Open seller onboarding"
      : "Sign in to start selling"
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
      <div className="sticky top-0 z-20 -mx-4 overflow-hidden rounded-b-[32px] bg-chrome px-4 pb-4 backdrop-blur">
        <div className="pt-3 text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/profile"
              aria-label="Open your profile"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/90 transition hover:bg-white/15"
            >
              <FiUser className="text-[18px]" />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle
                iconOnly
                className="border-white/10 bg-white/10 text-white hover:bg-white/15"
              />
              <Link
                href={sellerHref}
                aria-label={sellerLabel}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-chrome transition hover:brightness-95"
              >
                <FiPlus className="text-[20px]" />
              </Link>
            </div>
          </div>

          <div className="mt-5">
            <h1 className="text-[44px] font-bold leading-none tracking-[-0.05em]">
              {pageTitle}
            </h1>
          </div>

          <div className="relative mt-4 flex-1">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/55" />
            <Input
              className="border-white/10 bg-white/10 pl-11 text-white placeholder:text-white/50 focus:border-brand/50 focus:ring-brand/15"
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
              <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
                {[
                  { key: "general", label: "General" },
                  { key: "find", label: "Find Vendors" }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={cn(
                      "shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                      activeTab === tab.key
                        ? "border-brand/25 bg-brand/20 text-[#E8FFE7]"
                        : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                    )}
                    onClick={() => setActiveTab(tab.key as HomeTab)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/75">
                Live search
              </span>
            )}
            <div className="flex shrink-0 items-center gap-2">
              {!hasSupabase ? (
                <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-[11px] font-semibold text-brand">
                  Demo mode
                </span>
              ) : null}
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/75">
                {visibleVendorCount} vendors
              </span>
            </div>
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
            searchOnly ? "h-[calc(100dvh-288px)]" : "h-[calc(100dvh-332px)]"
          )}
        />
      )}
    </div>
  )
}
