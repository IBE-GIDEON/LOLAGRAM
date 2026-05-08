"use client"

import { FiMoon, FiSun } from "react-icons/fi"

import { useTheme } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle({
  className,
  iconOnly = false
}: {
  className?: string
  iconOnly?: boolean
}) {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === "dark"
  const label = dark ? "Switch to light mode" : "Switch to dark mode"

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        iconOnly
          ? "inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-soft hover:bg-canvas"
          : "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-soft hover:bg-canvas",
        className
      )}
      onClick={toggleTheme}
    >
      {dark ? <FiSun className="text-brand" /> : <FiMoon className="text-brand" />}
      {iconOnly ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span>{dark ? "Light" : "Dark"}</span>
      )}
    </button>
  )
}
