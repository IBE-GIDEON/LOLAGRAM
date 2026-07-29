"use client"

import { useId } from "react"

import { cn } from "@/lib/utils"

/**
 * GLOWGRAM mark: a shopping cart with the G knocked out of the basket, so the
 * background gradient shows through the letter.
 */
export function BrandLogo({ className }: { className?: string }) {
  // Unique per instance — several logos can share a page (nav, auth, footer).
  // Colons are stripped: React's generated ids contain them, and some browsers
  // fail to resolve url(#id) fragments that do.
  const maskId = `glowgram-cart-${useId().replace(/:/g, "")}`

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="GLOWGRAM"
      className={cn("h-6 w-6", className)}
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="40" height="40" fill="white" />
          <text
            x="23.5"
            y="25.4"
            textAnchor="middle"
            fontSize="13.5"
            fontWeight="800"
            fontFamily="inherit"
            fill="black"
          >
            G
          </text>
        </mask>
      </defs>

      {/* Handle */}
      <path
        d="M3.5 7.5h3.8a2.2 2.2 0 0 1 2.12 1.62l.5 1.88"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Basket, with the G cut out of it */}
      <path
        d="M10.6 12.6h25.1l-3.2 12.4a3.2 3.2 0 0 1-3.1 2.4H16.6a3.2 3.2 0 0 1-3.1-2.4l-2.9-12.4Z"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />

      {/* Wheels */}
      <circle cx="18.2" cy="33.4" r="2.5" fill="currentColor" />
      <circle cx="29.4" cy="33.4" r="2.5" fill="currentColor" />
    </svg>
  )
}
