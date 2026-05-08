"use client"

import Link from "next/link"
import { useMemo, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { FiChevronRight, FiMapPin } from "react-icons/fi"

import { Avatar, Badge, StarRating } from "@/components/ui"
import { formatCategory } from "@/lib/format"
import { type VendorSnapshot } from "@/lib/types"
import { cn } from "@/lib/utils"

export function VendorList({
  vendors,
  showRating = true,
  searchMode = false,
  onReachEnd,
  hasMore = false,
  className
}: {
  vendors: VendorSnapshot[]
  showRating?: boolean
  searchMode?: boolean
  onReachEnd?: () => void
  hasMore?: boolean
  className?: string
}) {
  const parentRef = useRef<HTMLDivElement | null>(null)
  const shouldVirtualize = vendors.length > 50

  const rowHeight = searchMode ? 78 : 86

  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? vendors.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 6
  })

  const virtualItems = virtualizer.getVirtualItems()

  const handleScroll = () => {
    if (!parentRef.current || !onReachEnd || !hasMore) {
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    if (scrollHeight - scrollTop - clientHeight < 120) {
      onReachEnd()
    }
  }

  const renderedVendors = useMemo(() => {
    if (!shouldVirtualize) {
      return vendors.map((vendor) => (
        <VendorRow
          key={vendor.id}
          vendor={vendor}
          showRating={showRating}
          searchMode={searchMode}
        />
      ))
    }

    return virtualItems.map((item) => {
      const vendor = vendors[item.index]
      return (
        <div
          key={vendor.id}
          data-index={item.index}
          ref={virtualizer.measureElement}
          className="absolute left-0 top-0 w-full"
          style={{ transform: `translateY(${item.start}px)` }}
        >
          <VendorRow
            vendor={vendor}
            showRating={showRating}
            searchMode={searchMode}
          />
        </div>
      )
    })
  }, [
    searchMode,
    shouldVirtualize,
    showRating,
    vendors,
    virtualItems,
    virtualizer
  ])

  return (
    <div
      ref={parentRef}
      className={cn(
        "h-[calc(100vh-252px)] overflow-y-auto rounded-[24px] border border-border/70 bg-surface shadow-soft",
        className
      )}
      onScroll={handleScroll}
    >
      {shouldVirtualize ? (
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {renderedVendors}
        </div>
      ) : (
        <div>{renderedVendors}</div>
      )}
      {hasMore ? (
        <div className="border-t border-border px-4 py-3 text-center text-xs text-muted">
          Loading more vendors...
        </div>
      ) : null}
    </div>
  )
}

function VendorRow({
  vendor,
  showRating,
  searchMode
}: {
  vendor: VendorSnapshot
  showRating: boolean
  searchMode: boolean
}) {
  return (
    <Link
      href={`/vendor/${vendor.id}`}
      className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 transition hover:bg-canvas active:bg-canvas"
    >
      <Avatar src={vendor.storePhotoUrl} alt={vendor.storeName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-bold text-ink">
              {vendor.storeName}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[13px] text-muted">
              {searchMode ? (
                <Badge className="bg-canvas text-[11px]">{formatCategory(vendor.category)}</Badge>
              ) : (
                <span>{formatCategory(vendor.category)}</span>
              )}
              <span className="inline-flex items-center gap-1">
                <FiMapPin className="text-[11px]" />
                {vendor.city}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {showRating ? (
              <StarRating rating={vendor.rating} size="sm" />
            ) : (
              <span className="text-[13px] text-muted">{vendor.city}</span>
            )}
            <FiChevronRight className="text-muted" />
          </div>
        </div>
      </div>
    </Link>
  )
}
