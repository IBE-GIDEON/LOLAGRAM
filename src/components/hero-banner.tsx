"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { FiArrowRight } from "react-icons/fi"

import { CATEGORY_TILES, HERO_SLIDES } from "@/lib/banners"
import { cn } from "@/lib/utils"

const ROTATE_MS = 6000

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
      className="relative overflow-hidden rounded-[28px] border border-border/50 bg-plum shadow-soft"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div className="relative h-[300px] sm:h-[340px] lg:h-[420px]">
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
              className="object-cover object-[50%_30%]"
            />
            {/* Warm wash keeps white type readable over any photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-plum via-plum/70 to-plum/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-plum/85 via-plum/25 to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7 lg:max-w-2xl lg:p-10">
              <span className="w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
                {slide.eyebrow}
              </span>
              <h2 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-[42px] lg:text-[54px]">
                {slide.title}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/80 lg:text-base">
                {slide.subtitle}
              </p>
              <Link
                href={slide.href}
                className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-plum shadow-soft transition hover:bg-blush active:scale-[0.99]"
              >
                {slide.ctaLabel}
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        ))}

        <div className="absolute bottom-4 right-5 flex items-center gap-2 lg:bottom-6 lg:right-8">
          {HERO_SLIDES.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show ${slide.title}`}
              aria-current={slideIndex === index}
              onClick={() => setIndex(slideIndex)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                slideIndex === index
                  ? "w-7 bg-white"
                  : "w-3 bg-white/45 hover:bg-white/70"
              )}
            />
          ))}
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

      <div className="scrollbar-none mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible">
        {CATEGORY_TILES.map((tile) => (
          <Link
            key={tile.id}
            href={tile.href}
            className="group relative aspect-[3/4] w-[150px] shrink-0 snap-start overflow-hidden rounded-[22px] border border-border/50 bg-canvas shadow-soft lg:w-auto"
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
