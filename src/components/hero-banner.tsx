"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { FiArrowRight } from "react-icons/fi"

import { CATEGORY_TILES, categoryHref, HERO_SLIDES } from "@/lib/banners"
import { cn } from "@/lib/utils"

const ROTATE_MS = 2000

/**
 * Editorial hero for the home feed. Auto-rotates, pauses on hover, and only
 * the first slide is eager-loaded so it never competes with the product feed.
 */
export function HeroBanner() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length)
    }, ROTATE_MS)

    return () => window.clearInterval(timer)
  }, [paused])

  return (
    <section
      className="relative overflow-hidden bg-plum"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div className="relative h-[400px] sm:h-[460px] lg:h-[540px]">
        {HERO_SLIDES.map((slide, slideIndex) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              slideIndex === index ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            aria-hidden={slideIndex !== index}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={slideIndex === 0}
              sizes="(max-width: 1024px) 100vw, 1100px"
              className="object-cover object-[50%_40%]"
            />
            {/* The photo runs edge to edge, but the type stays on the same
                1240 column as the rest of the page rather than drifting out
                to the screen edge on a wide monitor. */}
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-[1240px] px-4 pb-6 sm:pb-8 lg:px-6 lg:pb-12">
                {/* No wash over the photo, so legibility rides on the type
                    itself — a shadow on the glyphs darkens nothing behind them. */}
                <div className="flex flex-col [text-shadow:0_2px_10px_rgba(0,0,0,0.55)] lg:max-w-2xl">
                  <span className="w-fit rounded-full border border-white/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                    {slide.eyebrow}
                  </span>
                  <h2 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-[42px] lg:text-[54px]">
                    {slide.title}
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-white/90 lg:text-base">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.href}
                    // Literal hex, not bg-white/text-plum: globals.css rewrites
                    // .bg-white to the dark surface in dark mode, and both plum
                    // and blush go near-black there — the button rendered as
                    // dark text on a dark pill. This sits on a photograph,
                    // which is dark in either theme, so it stays light in both.
                    className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#FFFFFF] px-5 py-3 text-sm font-semibold text-[#401020] shadow-soft transition hover:bg-[#FAEBEE] active:scale-[0.99]"
                  >
                    {slide.ctaLabel}
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="pointer-events-none absolute inset-x-0 bottom-4 lg:bottom-6">
          <div className="mx-auto flex w-full max-w-[1240px] justify-end gap-2 px-4 lg:px-6">
            {HERO_SLIDES.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show ${slide.title}`}
                aria-current={slideIndex === index}
                onClick={() => setIndex(slideIndex)}
                className={cn(
                  "pointer-events-auto h-1.5 rounded-full transition-all",
                  // Same trap as the CTA: plain bg-white turns near-black in
                  // dark mode, so the active dot vanished against the photo.
                  slideIndex === index
                    ? "w-7 bg-[#FFFFFF]"
                    : "w-3 bg-white/45 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Horizontal category rail on mobile, even grid on desktop. */
export function CategoryRail() {
  return (
    <section aria-label="Shop by style">
      <div className="flex items-end justify-between gap-3 px-1">
        <h3 className="text-lg font-bold tracking-[-0.02em] text-ink">
          Shop by style
        </h3>
        <Link href="/search" className="text-[13px] font-semibold text-rose">
          See all
        </Link>
      </div>

      {/* Stays a scroller at every width. It used to become a 5-column grid at
          lg, which pinned it to exactly five and wrapped a sixth onto a second
          row. The width below keeps five across on desktop — the rest scroll. */}
      <div className="scrollbar-none mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 lg:gap-5">
        {CATEGORY_TILES.map((tile) => (
          <Link
            key={tile.id}
            href={categoryHref(tile)}
            // lg width = (container - 4 gaps of 1.25rem) / 5, so exactly five
            // sit in view and the sixth waits just off the right edge.
            className="group relative aspect-[3/4] w-[150px] shrink-0 snap-start overflow-hidden rounded-[22px] border border-border/50 bg-canvas shadow-soft lg:w-[calc((100%-5rem)/5)]"
          >
            <Image
              src={tile.image}
              alt=""
              fill
              sizes="(max-width: 1024px) 150px, 220px"
              className="object-cover transition duration-500 group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-sm font-bold leading-tight text-white">
                {tile.label}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-white/75">
                {tile.caption}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
