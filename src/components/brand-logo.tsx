"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * The Afunwa emblem — the profile and hair that form the A monogram.
 *
 * `tone` selects the artwork rather than a CSS colour: a PNG cannot inherit
 * currentColor, so the burgundy and cream cuts ship as separate files. Use
 * `ink` on light surfaces and `light` on the plum banner or in dark mode.
 */
export function BrandLogo({
  className,
  tone = "ink"
}: {
  className?: string
  tone?: "ink" | "light"
}) {
  return (
    <Image
      src={
        tone === "light"
          ? "/branding/afunwa-mark-light.png"
          : "/branding/afunwa-mark.png"
      }
      alt="Afunwa"
      width={463}
      height={463}
      className={cn("h-6 w-6 object-contain", className)}
    />
  )
}

/**
 * Emblem plus the AFUNWA / HAIRLINE GLOBAL wordmark, for headers and the
 * auth panel. Set the height and let the width follow the artwork.
 */
export function BrandLockup({
  className,
  tone = "ink",
  priority = false
}: {
  className?: string
  tone?: "ink" | "light"
  priority?: boolean
}) {
  return (
    <Image
      src={
        tone === "light"
          ? "/branding/afunwa-lockup-light.png"
          : "/branding/afunwa-lockup.png"
      }
      alt="Afunwa Hairline Global"
      width={1297}
      height={439}
      priority={priority}
      className={cn("w-auto object-contain", className)}
    />
  )
}
