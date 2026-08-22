"use client"

import { useEffect, useId, useRef, useState } from "react"
import { FiChevronDown } from "react-icons/fi"

import { Input } from "@/components/ui"
import { cn } from "@/lib/utils"

export type PlaceSuggestion = {
  text: string
  /** "Cross River, Nigeria" — the tiers above the one being picked. */
  secondary: string
}

/**
 * A text field that offers real places as you type.
 *
 * It stays an ordinary text input underneath. Suggestions are an accelerator,
 * never a gate: if the lookup is unconfigured, rate-limited or simply does not
 * know a village, whatever the buyer typed still stands. An address field that
 * refuses to accept an address it has not heard of is worse than no lookup.
 */
export function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  country,
  kind,
  placeholder,
  autoComplete
}: {
  value: string
  onChange: (next: string) => void
  /** Fires only on picking a suggestion, with its parent tiers attached. */
  onSelect?: (suggestion: PlaceSuggestion) => void
  /** ISO 3166-1 alpha-2 — results are confined to this country. */
  country: string
  kind: "region" | "city"
  placeholder?: string
  autoComplete?: string
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listId = useId()
  // Set when a value came from the list, so choosing a suggestion does not
  // immediately trigger a search for the thing just chosen.
  const justPicked = useRef(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Nothing to fetch for a field nobody is looking at.
    if (!open) return

    if (justPicked.current) {
      justPicked.current = false
      return
    }

    const query = value.trim()
    // Opening the list is a click and should feel like one; typing gets a
    // pause so a word costs one request rather than one per letter.
    const delay = query ? 200 : 0

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetch(
        `/api/places?input=${encodeURIComponent(query)}&country=${encodeURIComponent(
          country
        )}&kind=${kind}`,
        { signal: controller.signal }
      )
        .then((response) => (response.ok ? response.json() : { suggestions: [] }))
        .then((data: { suggestions?: PlaceSuggestion[] }) => {
          setSuggestions(data.suggestions ?? [])
          setActiveIndex(-1)
        })
        .catch(() => undefined)
    }, delay)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [value, country, kind, open])

  // Changing country invalidates whatever was on offer for the old one.
  useEffect(() => {
    setSuggestions([])
    setOpen(false)
  }, [country])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  const pick = (suggestion: PlaceSuggestion) => {
    justPicked.current = true
    onChange(suggestion.text)
    onSelect?.(suggestion)
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
  }

  const visible = open && suggestions.length > 0

  return (
    <div ref={containerRef} className="relative">
      <Input
        className="pr-10"
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete ?? "off"}
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        // Focus alone does not fire again once the field already has it, so a
        // click after Escape would otherwise never reopen the list.
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (!visible) return

          if (event.key === "ArrowDown") {
            event.preventDefault()
            setActiveIndex((current) => (current + 1) % suggestions.length)
          } else if (event.key === "ArrowUp") {
            event.preventDefault()
            setActiveIndex((current) =>
              current <= 0 ? suggestions.length - 1 : current - 1
            )
          } else if (event.key === "Enter" && activeIndex >= 0) {
            // Only swallow Enter when a suggestion is highlighted, so Enter
            // still submits the form the rest of the time.
            event.preventDefault()
            pick(suggestions[activeIndex])
          } else if (event.key === "Escape") {
            setOpen(false)
          }
        }}
      />

      {/* The one thing that says "this is a dropdown". Without it the control
          reads as a plain text box and nobody thinks to click it. */}
      <FiChevronDown
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-transform",
          visible && "rotate-180"
        )}
      />

      {visible ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-border bg-surface py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.text}-${index}`}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "block w-full px-4 py-2.5 text-left transition",
                  index === activeIndex ? "bg-canvas" : "hover:bg-canvas"
                )}
                // pointerdown, not click: the input's blur would close the list
                // before a click ever landed.
                onPointerDown={(event) => {
                  event.preventDefault()
                  pick(suggestion)
                }}
              >
                <span className="block text-sm text-ink">{suggestion.text}</span>
                {suggestion.secondary ? (
                  <span className="block text-xs text-muted">
                    {suggestion.secondary}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
