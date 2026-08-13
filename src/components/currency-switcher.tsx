"use client"

import { useEffect, useRef, useState } from "react"
import { FiCheck, FiChevronDown } from "react-icons/fi"

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
  const rootRef = useRef<HTMLDivElement | null>(null)
  const active = getCurrencyMeta(currency)

  // Close on outside click and on Escape — a menu you cannot dismiss on a
  // phone is worse than no menu.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
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
        <div
          role="listbox"
          aria-label="Choose your currency"
          className="absolute right-0 z-50 mt-2 max-h-[60vh] w-[264px] overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-soft"
        >
          {CURRENCIES.map((entry) => {
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
          })}
        </div>
      ) : null}
    </div>
  )
}
