"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

type RemoteImageProps = {
  src: string | undefined | null
  alt: string
  sizes?: string
  /** Extra classes merged on top of the default object-cover base styles. */
  className?: string
  priority?: boolean
}

/**
 * Hosts declared in next.config.mjs `images.remotePatterns`. Anything else is
 * rendered with a plain <img>: next/image THROWS on an unconfigured host, and
 * that throw takes down the whole feed. Sellers can paste any image URL, so
 * this component must never be able to crash the page it lives on.
 */
const OPTIMIZABLE_HOST_PATTERNS = [/\.supabase\.co$/i, /\.supabase\.in$/i]

function canOptimize(src: string) {
  if (src.startsWith("/")) return true
  if (!src.startsWith("https://") && !src.startsWith("http://")) return false

  try {
    const { hostname } = new URL(src)
    return OPTIMIZABLE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))
  } catch {
    return false
  }
}

/**
 * Renders an optimized next/image for known hosts and falls back to a plain
 * <img> for data: / blob: URLs and any unconfigured remote host.
 * The parent element must have `position: relative` when using fill layout.
 *
 * className is ADDITIVE — base styles (object-cover etc.) are always applied.
 * Pass extra utility classes (e.g. "opacity-40") to layer on top.
 */
export function RemoteImage({ src, alt, sizes, className, priority }: RemoteImageProps) {
  if (!src) return null

  if (!canOptimize(src)) {
    // data:, blob:, or a host we have not allowlisted for the optimizer
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full object-cover", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "100vw"}
      className={cn("object-cover", className)}
      priority={priority}
    />
  )
}
