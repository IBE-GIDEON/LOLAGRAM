"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useState } from "react"
import { FiChevronRight, FiMapPin, FiSearch } from "react-icons/fi"

import { Avatar, Badge, Input, SectionHeading, StarRating } from "@/components/ui"
import { formatCategory, formatCurrency } from "@/lib/format"
import { loadMarketplaceSearch } from "@/lib/marketplace"
import {
  type MarketplaceSearchResults,
  type ProductSearchResult,
  type VendorSnapshot
} from "@/lib/types"
import { cn } from "@/lib/utils"

type SearchMode = "all" | "products" | "stores"

const suggestionTerms = [
  "bag",
  "watch",
  "wig",
  "lipstick",
  "dress",
  "jewellery"
]

const emptyResults: MarketplaceSearchResults = {
  products: [],
  vendors: []
}

export function SearchPageClient() {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<SearchMode>("all")
  const [results, setResults] = useState<MarketplaceSearchResults>(emptyResults)
  const [loading, setLoading] = useState(true)
  const [scrollTop, setScrollTop] = useState(0)
  const deferredQuery = useDeferredValue(query)
  const activeQuery = deferredQuery.trim()
  const showProducts = mode === "all" || mode === "products"
  const showVendors = mode === "all" || mode === "stores"
  const showCompactHeader = scrollTop > 88

  useEffect(() => {
    let ignore = false
    setLoading(true)

    loadMarketplaceSearch(deferredQuery)
      .then((data) => {
        if (!ignore) {
          setResults(data)
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [deferredQuery])

  return (
    <div className="pb-6 pt-0">
      <div
        className="h-[calc(100dvh-116px)] overflow-y-auto bg-canvas"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
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
                showCompactHeader
                  ? "translate-y-0 opacity-100"
                  : "translate-y-1 opacity-0"
              )}
            >
              Search
            </span>
          </div>
        </div>

        <div className="bg-canvas px-4 pb-3 pt-3">
          <h1 className="text-[32px] font-bold tracking-[-0.04em] text-ink">Search</h1>
          <p className="mt-1 text-sm text-muted">
            Search products, stores, categories, or cities in one place.
          </p>

          <div className="relative mt-4">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              className="pl-11"
              placeholder="Search bag, watch, wig, lipstick, or store name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {([
              ["all", "All"],
              ["products", "Products"],
              ["stores", "Stores"]
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                  mode === value
                    ? "border-transparent bg-chrome text-white dark:bg-brand dark:text-chrome"
                    : "border-border bg-surface text-muted hover:bg-canvas"
                )}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {!activeQuery ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {suggestionTerms.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="shrink-0 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-muted transition hover:bg-canvas"
                  onClick={() => setQuery(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6 px-4 py-4">
          {showProducts ? (
            <section>
              <SectionHeading
                title={activeQuery ? "Products" : "Trending products"}
                action={
                  <span className="text-xs font-medium text-muted">
                    {results.products.length} results
                  </span>
                }
              />
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="aspect-[0.82] animate-pulse rounded-[22px] bg-surface"
                    />
                  ))}
                </div>
              ) : results.products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {results.products.map((product) => (
                    <ProductSearchCard key={product.id} product={product} />
                  ))}
                </div>
              ) : activeQuery ? (
                <p className="text-sm leading-6 text-muted">
                  No product matched "{activeQuery}" yet. Try another word like
                  watch, wig, bag, lipstick, or dress.
                </p>
              ) : null}
            </section>
          ) : null}

          {showVendors ? (
            <section>
              <SectionHeading
                title={activeQuery ? "Stores" : "Popular stores"}
                action={
                  <span className="text-xs font-medium text-muted">
                    {results.vendors.length} results
                  </span>
                }
              />
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[82px] animate-pulse border-b border-border bg-surface/80"
                    />
                  ))}
                </div>
              ) : results.vendors.length > 0 ? (
                <div className="divide-y divide-border overflow-hidden rounded-[24px] bg-surface">
                  {results.vendors.map((vendor) => (
                    <VendorSearchRow key={vendor.id} vendor={vendor} />
                  ))}
                </div>
              ) : activeQuery ? (
                <p className="text-sm leading-6 text-muted">
                  No store matched "{activeQuery}" directly. Try product words too,
                  not only vendor names.
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ProductSearchCard({ product }: { product: ProductSearchResult }) {
  return (
    <Link
      href={`/vendor/${product.vendor.id}?product=${product.id}`}
      className="overflow-hidden rounded-[22px] border border-border/70 bg-surface text-left transition hover:bg-canvas"
    >
      <div className="aspect-square overflow-hidden bg-canvas">
        {product.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.photoUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-ink">{product.name}</p>
        <p className="text-base font-bold text-brand">
          {formatCurrency(product.price)}
        </p>
        <p className="text-xs text-muted">Sold by {product.vendor.storeName}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-canvas text-[11px]">
            {formatCategory(product.vendor.category)}
          </Badge>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-1 text-[11px] font-medium",
              product.inStock
                ? "bg-emerald-100 text-success"
                : "bg-rose-100 text-rose-700"
            )}
          >
            {product.inStock ? "In stock" : "Out of stock"}
          </span>
        </div>
      </div>
    </Link>
  )
}

function VendorSearchRow({ vendor }: { vendor: VendorSnapshot }) {
  return (
    <Link
      href={`/vendor/${vendor.id}`}
      className="flex items-center gap-3 bg-surface px-4 py-3 transition hover:bg-canvas"
    >
      <Avatar src={vendor.storePhotoUrl} alt={vendor.storeName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-bold text-ink">
              {vendor.storeName}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[13px] text-muted">
              <Badge className="bg-canvas text-[11px]">
                {formatCategory(vendor.category)}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <FiMapPin className="text-[11px]" />
                {vendor.city}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StarRating rating={vendor.rating} size="sm" />
            <FiChevronRight className="text-muted" />
          </div>
        </div>
      </div>
    </Link>
  )
}
