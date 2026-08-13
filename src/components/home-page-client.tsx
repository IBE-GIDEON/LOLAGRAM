"use client"

import Image from "next/image"
import Link from "next/link"
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { FiSearch, FiX } from "react-icons/fi"

import { BrandLockup } from "@/components/brand-logo"
import { CategoryRail, HeroBanner } from "@/components/hero-banner"
import { ProductFeed } from "@/components/product-feed"
import { useAuth } from "@/components/providers/auth-provider"
import { Avatar, Input } from "@/components/ui"
import { VendorList } from "@/components/vendor-list"
import { VENDOR_DISCOVERY_ENABLED } from "@/lib/feature-flags"
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
  const initialTab: HomeTab =
    searchOnly && VENDOR_DISCOVERY_ENABLED ? "find" : "general"
  const initialVendors = initialTab === "find" ? peekCachedVendors("") : []
  const initialProducts =
    initialTab === "general" ? peekCachedProductFeed("") : []
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  // With vendor discovery closed there is only one store to browse, so the feed
  // is always the product feed no matter what the tab state says.
  const isFindTab = VENDOR_DISCOVERY_ENABLED && (searchOnly || activeTab === "find")
  const [vendors, setVendors] = useState<VendorSnapshot[]>(initialVendors)
  const [products, setProducts] = useState<ProductSearchResult[]>(initialProducts)
  const [loading, setLoading] = useState(
    initialTab === "find" ? initialVendors.length === 0 : initialProducts.length === 0
  )
  const [visibleCount, setVisibleCount] = useState(INITIAL_PRODUCT_BATCH)
  const stickyRef = useRef<HTMLDivElement | null>(null)
  const compactRef = useRef(false)

  /**
   * Scroll position drives one thing — whether the compact title bar is shown —
   * so it is written straight to the DOM. Holding it in React state re-rendered
   * this whole component (hero carousel, category rail, every product card) on
   * each scroll frame, which is what made phones stutter.
   */
  const handleScrollPosition = useCallback((top: number) => {
    const next = top > 88
    if (next === compactRef.current) return
    compactRef.current = next
    if (stickyRef.current) {
      stickyRef.current.dataset.compact = next ? "true" : "false"
    }
  }, [])

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

  /**
   * Typing turns the home page into a results page: the hero and the category
   * rail are browsing furniture, and they push the actual matches below the
   * fold exactly when the buyer has told us what they want. Keyed off `query`
   * rather than the deferred value so the chrome clears on the first keystroke.
   */
  const isSearching = query.trim().length > 0
  const pageTitle = searchOnly ? "Search" : "Afunwa"
  const displayedProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  )
  const visibleResultCount = isFindTab ? vendors.length : products.length
  const hasMore = !isFindTab && visibleCount < products.length
  const searchPlaceholder = isFindTab
    ? "Search store name or category"
    : "Search any product name or description"
  const resultCopy = isSearching
    ? `Showing what matches "${query.trim()}".`
    : isFindTab
      ? "Search across store names, categories, and cities."
      : VENDOR_DISCOVERY_ENABLED
        ? "Browse newly uploaded products from active vendors."
        : "Browse everything we have in stock right now."
  const resultLabel = isFindTab
    ? visibleResultCount === 1
      ? "vendor"
      : "vendors"
    : visibleResultCount === 1
      ? "product"
      : "products"
  const emptyProductState = deferredQuery.trim()
    ? `No product matched "${deferredQuery.trim()}" yet. Try another word from the seller's product name or description.`
    : VENDOR_DISCOVERY_ENABLED
      ? "Newly uploaded products from active vendors will show here."
      : "New arrivals show up here as soon as they are listed."
  const stickyHeader = (
    <div
      ref={stickyRef}
      data-compact="false"
      className="group pointer-events-none sticky top-0 z-20 -mb-12 lg:top-[72px] border-b border-transparent bg-transparent transition-colors duration-200 data-[compact=true]:border-black/5 data-[compact=true]:bg-white/70 data-[compact=true]:backdrop-blur-md dark:data-[compact=true]:border-white/10 dark:data-[compact=true]:bg-black/40"
    >
      <div className="flex h-12 items-center justify-center">
        <span className="translate-y-1 text-sm font-semibold tracking-[-0.01em] text-ink opacity-0 transition duration-200 group-data-[compact=true]:translate-y-0 group-data-[compact=true]:opacity-100 dark:text-white">
          Afunwa
        </span>
      </div>
    </div>
  )
  const header = (
    <>
    <div className="relative overflow-hidden bg-plum px-4 pb-5 pt-3 text-white lg:px-6 lg:pb-4 lg:pt-6">
      {/* Photo banner instead of a flat colour block. Sits at 40% under a plum
          wash so white type stays readable over any part of the image. */}
      <Image
        src="/banners/hero-noir.jpg"
        alt=""
        fill
        priority
        quality={55}
        sizes="100vw"
        className="pointer-events-none select-none object-cover object-[50%_35%] opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-plum/45 via-plum/70 to-plum"
      />

      <div className="relative mx-auto w-full max-w-[1240px]">
      <div className="flex items-center justify-between gap-3 lg:hidden">
        {/* The lockup is the headline. As type it would have been 16 characters
            at 44px next to an avatar — it never fit. */}
        <h1 className="flex min-w-0">
          {searchOnly ? (
            <span className="text-[40px] font-bold leading-none tracking-[-0.04em] drop-shadow-sm">
              {pageTitle}
            </span>
          ) : (
            <BrandLockup tone="light" className="h-12 sm:h-14" priority />
          )}
        </h1>
        <Link
          href="/profile"
          aria-label="Open profile"
          className="inline-flex rounded-full ring-2 ring-white/35 transition hover:scale-[1.02] hover:ring-white/60"
        >
          <Avatar
            src={profile?.profilePhotoUrl}
            alt={profile?.fullName ?? "Profile"}
            className="h-11 w-11 border border-white/20 bg-white/15 text-white shadow-sm"
          />
        </Link>
      </div>

      <div className="relative mt-4 flex-1 lg:mx-auto lg:mt-0 lg:max-w-xl">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          className="border-white/15 bg-white/92 pl-11 pr-11 text-ink shadow-soft placeholder:text-muted focus:border-rose/40 focus:ring-rose/20"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {/* Searching hides the hero, so there has to be a one-tap way back. */}
        {isSearching ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted transition hover:bg-black/5 hover:text-ink"
          >
            <FiX />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 lg:mx-auto lg:max-w-xl">
        <p className="text-xs font-medium text-white/70">{resultCopy}</p>
        <span className="shrink-0 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur-sm">
          {visibleResultCount} {resultLabel}
        </span>
      </div>

      {/* Nothing to switch between while we are the only store: the General /
          Find Vendors pair comes back with VENDOR_DISCOVERY_ENABLED. */}
      {VENDOR_DISCOVERY_ENABLED || searchOnly ? (
        <div className="mt-3 flex items-center justify-between gap-3 lg:mx-auto lg:max-w-md">
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
            <span className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white/80">
              Live search
            </span>
          )}
        </div>
      ) : null}
      </div>
    </div>

    {/* Editorial content sits on the page, not on the banner — one photo
        behind the search bar reads premium, two stacked reads busy. */}
    {!searchOnly && !isSearching ? (
      <div className="text-ink">
        {/* Full bleed, and flush against the search banner above it — both are
            the same burgundy, so they read as one block rather than a card
            floating on the page. */}
        <HeroBanner />
        <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-6">
          <CategoryRail />
        </div>
      </div>
    ) : null}
    </>
  )

  return (
    <div className="pb-6 pt-0">
      {isFindTab ? (
        <VendorList
          vendors={vendors}
          showRating={false}
          searchMode
          loading={loading}
          onScrollPositionChange={handleScrollPosition}
          stickyHeader={stickyHeader}
          header={header}
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
          onScrollPositionChange={handleScrollPosition}
          stickyHeader={stickyHeader}
          header={header}
          emptyState={emptyProductState}
        />
      )}
    </div>
  )
}
