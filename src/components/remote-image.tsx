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
 * Renders an optimized next/image for real HTTPS URLs (Supabase storage, CDN)
 * and falls back to a plain <img> for data: / blob: URLs that appear in demo mode.
 * The parent element must have `position: relative` when using fill layout.
 *
 * className is ADDITIVE — base styles (object-cover etc.) are always applied.
 * Pass extra utility classes (e.g. "opacity-40") to layer on top.
 */
export function RemoteImage({ src, alt, sizes, className, priority }: RemoteImageProps) {
  if (!src) return null

  const isOptimizable = src.startsWith("https://") || src.startsWith("http://")

  if (!isOptimizable) {
    // data: or blob: URLs — can't pass through Next.js image optimizer
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
