"use client"

import { useEffect, useRef } from "react"

/**
 * Window scroll, gated to one read per frame.
 *
 * The app scrolls as a single document rather than as a fixed-height box with
 * its own scrollbar. That is what lets a mobile browser collapse its address
 * bar on scroll — a page that cannot scroll keeps the bar forever and boxes the
 * content into whatever height is left.
 */
export function usePageScroll(
  onScroll: (state: { scrollTop: number; nearBottom: boolean }) => void,
  { bottomThreshold = 180 }: { bottomThreshold?: number } = {}
) {
  // Held in a ref so an inline callback does not re-subscribe every render.
  const handlerRef = useRef(onScroll)
  handlerRef.current = onScroll

  useEffect(() => {
    let frame: number | null = null

    const read = () => {
      frame = null
      const doc = document.documentElement
      const scrollTop = window.scrollY
      handlerRef.current({
        scrollTop,
        nearBottom:
          doc.scrollHeight - scrollTop - window.innerHeight < bottomThreshold
      })
    }

    const handleScroll = () => {
      if (frame !== null) return
      frame = requestAnimationFrame(read)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    // Fires once so a short page still reports "near bottom" and can load more.
    read()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [bottomThreshold])
}
