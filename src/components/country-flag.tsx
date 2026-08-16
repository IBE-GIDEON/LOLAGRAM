"use client"

import { FiGlobe } from "react-icons/fi"

import { cn } from "@/lib/utils"

/**
 * Flags as static SVG files from /public/flags rather than bundled components.
 *
 * With 150 currencies in the switcher, importing each flag as a React component
 * would drag every one into the JavaScript bundle whether it is ever shown or
 * not, because the lookup is dynamic and nothing can be tree-shaken. As files
 * they cost nothing up front, only the handful on screen are fetched, and the
 * service worker caches them like any other image.
 *
 * Not emoji: regional-indicator pairs draw as bare letters on Windows.
 */
export function CountryFlag({
  region,
  className
}: {
  /** ISO 3166-1 alpha-2, or null for a multi-country currency zone. */
  region: string | null
  className?: string
}) {
  if (!region) {
    // XOF, XAF, XCD and XPF each span several countries — no one flag is honest.
    return (
      <FiGlobe
        aria-hidden="true"
        className={cn("h-3.5 w-5 shrink-0 text-muted", className)}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${region}.svg`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      width={20}
      height={14}
      className={cn(
        "h-3.5 w-5 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]",
        className
      )}
    />
  )
}
