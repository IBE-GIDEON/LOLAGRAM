"use client"

import type { PropsWithChildren, ReactNode } from "react"
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

export function BottomSheet({
  open,
  onClose,
  title,
  children
}: PropsWithChildren<{
  open: boolean
  onClose: () => void
  title?: string
}>) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close sheet"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-[28px] border-t border-border bg-surface shadow-2xl">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" />
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button
            aria-label="Close"
            className="rounded-full p-2 text-muted transition hover:bg-canvas"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>
        <div className="max-h-[calc(88vh-72px)] overflow-y-auto px-5 pb-8">
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
