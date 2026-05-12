"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { FiSearch } from "react-icons/fi"

import { ProductFeed } from "@/components/product-feed"
import { useAuth } from "@/components/providers/auth-provider"
import { Avatar, Input } from "@/components/ui"
import { VendorList } from "@/components/vendor-list"
import {
  loadProductFeed,
  loadVendors,
  peekCachedProductFeed,
  peekCachedVendors
} from "@/lib/marketplace"
import { type ProductSearchResult, type VendorSnapshot } from "@/lib/types"
import { cn } from "@/lib/utils"

type HomeTab = "find" | "general"
const INITIAL_PRODUCT_BATCH = 12

export function HomePageClient({
  searchOnly = false
}: {
  searchOnly?: boolean
}) {
  const { profile } = useAuth()
  const initialTab: HomeTab = searchOnly ? "find" : "general"
  const initialVendors = initialTab === "find" ? peekCachedVendors("") : []
  const initialProducts =
    initialTab === "general" ? peekCachedProductFeed("") : []
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const isFindTab = searchOnly || activeTab === "find"
  const [vendors, setVendors] = useState<VendorSnapshot[]>(initialVendors)
  const [products, setProducts] = useState<ProductSearchResult[]>(initialProducts)
  const [loading, setLoading] = useState(
    initialTab === "find" ? initialVendors.length === 0 : initialProducts.length === 0
  )
  const [visibleCount, setVisibleCount] = useState(INITIAL_PRODUCT_BATCH)
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    let ignore = false
    setLoading((isFindTab ? vendors.length : products.length) === 0)

    if (isFindTab) {
      loadVendors(deferredQuery)
        .then((data) => {
          if (!ignore) {
            setVendors(data)
          }
        })
        .finally(() => {
          if (!ignore) {
            setLoading(false)
          }
        })
    } else {
      loadProductFeed(deferredQuery)
        .then((data) => {
          if (!ignore) {
            setProducts(data)
          }
        })
        .finally(() => {
          if (!ignore) {
            setLoading(false)
          }
        })
    }

    return () => {
      ignore = true
    }
  }, [deferredQuery, isFindTab])

  useEffect(() => {
    setVisibleCount(INITIAL_PRODUCT_BATCH)
  }, [activeTab, deferredQuery])

  const pageTitle = searchOnly ? "Search" : "Lolagram"
  const displayedProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  )
  const visibleResultCount = isFindTab ? vendors.length : products.length
  const hasMore = !isFindTab && visibleCount < products.length
  const showCompactHeader = scrollTop > 88
  const searchPlaceholder = isFindTab
    ? "Search store name or category"
    : "Search bag, watch, wig, lipstick, or dress"
  const resultCopy = isFindTab
    ? "Search across store names, categories, and cities."
    : "Browse newly uploaded products from active vendors."
  const resultLabel = isFindTab
    ? visibleResultCount === 1
      ? "vendor"
      : "vendors"
    : visibleResultCount === 1
      ? "product"
      : "products"
  const emptyProductState = deferredQuery.trim()
    ? `No product matched "${deferredQuery.trim()}" yet. Try bag, watch, wig, lipstick, or dress.`
    : "Newly uploaded products from active vendors will show here."
  const stickyHeader = (
    <div
      className={cn(
        "pointer-events-none sticky top-0 z-20 -mb-12 transition-all duration-200",
        showCompactHeader
          ? "border-b border-black/5 bg-white/38 backdrop-blur-xl dark:border-white/10 dark:bg-black/18"
          : "border-b border-transparent bg-transparent backdrop-blur-0"
      )}
    >
      <div className="flex h-12 items-center justify-center">
        <span
          className={cn(
            "text-sm font-semibold tracking-[-0.01em] text-ink transition-all duration-200 dark:text-white",
            showCompactHeader ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          )}
        >
          Lolagram
        </span>
      </div>
    </div>
  )
  const header = (
    <div className="bg-brand px-4 pb-4 pt-3 text-chrome dark:bg-chrome dark:text-white">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[44px] font-bold leading-none tracking-[-0.05em]">
          {pageTitle}
        </h1>
        <Link
          href="/profile"
          aria-label="Open profile"
          className="inline-flex rounded-full ring-2 ring-white/40 transition hover:scale-[1.02] hover:ring-white/60 dark:ring-white/10 dark:hover:ring-white/20"
        >
          <Avatar
            src={profile?.profilePhotoUrl}
            alt={profile?.fullName ?? "Profile"}
            className="h-11 w-11 border border-black/10 bg-white/80 text-chrome shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white"
          />
        </Link>
      </div>

      <div className="relative mt-4 flex-1">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted dark:text-white/55" />
        <Input
          className="border-black/5 bg-white/90 pl-11 text-ink placeholder:text-muted focus:border-chrome/10 focus:ring-black/5 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:focus:border-brand/50 dark:focus:ring-brand/15"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-chrome/72 dark:text-white/60">
          {resultCopy}
        </p>
        <span className="shrink-0 rounded-full border border-black/10 bg-white/45 px-3 py-1.5 text-[11px] font-semibold text-chrome/80 dark:border-white/10 dark:bg-white/10 dark:text-white/75">
          {visibleResultCount} {resultLabel}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
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
  )

  return (
    <div className="pb-6 pt-0">
      {isFindTab ? (
        <VendorList
          vendors={vendors}
          showRating={false}
          searchMode
          loading={loading}
          onScrollPositionChange={setScrollTop}
          stickyHeader={stickyHeader}
          header={header}
          className="h-[calc(100dvh-116px)]"
        />
      ) : (
        <ProductFeed
          products={displayedProducts}
          loading={loading}
          hasMore={hasMore}
          onReachEnd={() =>
            setVisibleCount((current) =>
              Math.min(current + INITIAL_PRODUCT_BATCH, products.length)
            )
          }
          onScrollPositionChange={setScrollTop}
          stickyHeader={stickyHeader}
          header={header}
          emptyState={emptyProductState}
          className="h-[calc(100dvh-116px)]"
        />
      )}
    </div>
  )
}
