"use client"

import { useEffect, useRef, type PropsWithChildren, type ReactNode } from "react"
import { FiStar, FiX } from "react-icons/fi"

import { cn } from "@/lib/utils"

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost"
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
  const variants = {
    primary: "bg-chrome text-white shadow-soft hover:brightness-95",
    secondary: "border border-border bg-surface text-ink shadow-soft hover:bg-canvas",
    outline: "border border-border bg-surface text-ink hover:border-brand/40 hover:text-brand",
    ghost: "bg-transparent text-ink hover:bg-canvas"
  }

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  )
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand/40 focus:ring-2 focus:ring-brand/10",
        className
      )}
      {...props}
    />
  )
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[112px] w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand/40 focus:ring-2 focus:ring-brand/10",
        className
      )}
      {...props}
    />
  )
}

/**
 * The three page widths, and the only place they are defined.
 *
 * MobileShell already caps phones at 430px, so these only take effect from lg
 * up — they stop a settings page or an order from being stretched across a
 * whole desktop monitor. Pick by what the page holds, not by which page it is:
 *
 * - `wide`    product grids and storefronts
 * - `content` lists and detail pages
 * - `form`    anything that is mostly inputs
 */
export const PAGE_WIDTH = {
  wide: "mx-auto w-full max-w-[1240px]",
  content: "mx-auto w-full max-w-[880px]",
  form: "mx-auto w-full max-w-[640px]"
} as const

export function Card({
  className,
  children
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("rounded-card border border-border/70 bg-surface shadow-soft", className)}>
      {children}
    </div>
  )
}

export function Badge({
  className,
  children
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-muted",
        className
      )}
    >
      {children}
    </span>
  )
}

export function Avatar({
  src,
  alt,
  className
}: {
  src?: string
  alt: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/15 text-sm font-semibold text-chrome",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        alt.slice(0, 1).toUpperCase()
      )}
    </div>
  )
}

/**
 * A bottom sheet on phones and a centred dialog from md up — without the width
 * cap a "sheet" spans the whole desktop viewport and its contents blow up with
 * it. Closes on Escape and locks background scroll while open.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  size = "md",
  children
}: PropsWithChildren<{
  open: boolean
  onClose: () => void
  title?: string
  /** md suits forms and the cart; lg suits the two-column product detail. */
  size?: "md" | "lg"
}>) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close sheet"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-[28px] border-t border-border bg-surface shadow-2xl",
          "md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[86vh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px] md:border",
          size === "lg" ? "md:w-[min(940px,92vw)]" : "md:w-[min(620px,92vw)]"
        )}
      >
        {/* Drag handle reads as a sheet affordance — pointless on a dialog */}
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border md:hidden" />
        <div className="flex items-center justify-between px-5 py-4 md:px-6">
          <h3 className="text-base font-semibold text-ink md:text-lg">{title}</h3>
          <button
            aria-label="Close"
            className="rounded-full p-2 text-muted transition hover:bg-canvas"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>
        <div className="max-h-[calc(88vh-72px)] overflow-y-auto px-5 pb-8 md:max-h-[calc(86vh-76px)] md:px-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export function StarRating({
  rating,
  reviewCount,
  size = "sm"
}: {
  rating: number
  reviewCount?: number
  size?: "sm" | "md"
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-brand/5 px-2.5 py-1 text-brand",
        size === "sm" ? "text-xs" : "text-sm"
      )}
    >
      <FiStar className="fill-brand" />
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      {typeof reviewCount === "number" ? (
        <span className="text-muted">({reviewCount})</span>
      ) : null}
    </div>
  )
}

export function SectionHeading({
  title,
  action
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {action}
    </div>
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-canvas", className)} />
}
