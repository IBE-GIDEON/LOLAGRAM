"use client"

import Image from "next/image"

type RemoteImageProps = {
  src: string | undefined | null
  alt: string
  sizes?: string
  className?: string
  priority?: boolean
}

/**
 * Renders an optimized next/image for real HTTPS URLs (Supabase storage, CDN)
 * and falls back to a plain <img> for data: / blob: URLs that appear in demo mode.
 * The parent element must have `position: relative` when using fill layout.
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
        className={className ?? "h-full w-full object-cover"}
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
      className={className ?? "object-cover"}
      priority={priority}
    />
  )
}
