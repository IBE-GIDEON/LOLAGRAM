"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { FiCheck, FiChevronDown, FiSearch } from "react-icons/fi"

import { CountryFlag } from "@/components/country-flag"
import { useLocale } from "@/components/providers/locale-provider"
import { CURRENCIES, getCurrencyMeta } from "@/lib/currency"
import { cn } from "@/lib/utils"

/**
 * Country / currency picker for the header.
 *
 * Flags are inline SVG, not emoji: emoji flags draw as bare letters on Windows.
 */
export function CurrencySwitcher({
  className,
  tone = "ink"
}: {
  className?: string
  /** `light` for the plum banner, `ink` for the white desktop nav. */
  tone?: "ink" | "light"
}) {
  const { currency, setCurrency } = useLocale()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const active = getCurrencyMeta(currency)

  // Country, currency name and code all match, so "cedi", "ghana" and "ghs"
  // each find the same row.
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return CURRENCIES

    return CURRENCIES.filter(
      (entry) =>
        entry.country.toLowerCase().includes(needle) ||
        entry.name.toLowerCase().includes(needle) ||
        entry.code.toLowerCase().includes(needle)
    )
  }, [query])

  useEffect(() => {
    if (!open) {
      setQuery("")
      return
    }

    const focus = window.setTimeout(() => searchRef.current?.focus(), 60)

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      window.clearTimeout(focus)
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${active.country}, ${active.code}`}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[13px] font-semibold transition",
          tone === "light"
            ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
            : "border-border bg-surface text-ink hover:bg-canvas"
        )}
      >
        <CountryFlag region={active.region} />
        <span>{active.code}</span>
        <FiChevronDown
          aria-hidden="true"
          className={cn("transition", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 flex max-h-[min(70vh,26rem)] w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
          {/* Outside the scroll area so it stays put while the list moves. */}
          <div className="border-b border-border p-2">
            <div className="relative">
              <FiSearch
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search country or currency"
                aria-label="Search currencies"
                className="w-full rounded-xl border border-border bg-canvas py-2 pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-muted focus:border-brand/40"
              />
            </div>
          </div>

          <div role="listbox" aria-label="Choose your currency" className="overflow-y-auto p-1.5">
            {results.length === 0 ? (
              <p className="px-2.5 py-6 text-center text-[13px] text-muted">
                Nothing matches &ldquo;{query.trim()}&rdquo;.
              </p>
            ) : (
              results.map((entry) => {
                const selected = entry.code === currency
                return (
                  <button
                    key={entry.code}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setCurrency(entry.code)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition",
                      selected ? "bg-canvas" : "hover:bg-canvas"
                    )}
                  >
                    <CountryFlag region={entry.region} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">
                        {entry.country}
                      </span>
                      <span className="block truncate text-[11px] text-muted">
                        {entry.name}
                      </span>
                    </span>
                    <span className="text-[11px] font-semibold text-muted">
                      {entry.code}
                    </span>
                    {selected ? (
                      <FiCheck aria-hidden="true" className="text-brand" />
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
