"use client"

import { FiMoon, FiSun } from "react-icons/fi"

import { useTheme } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === "dark"

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-soft hover:bg-canvas",
        className
      )}
      onClick={toggleTheme}
    >
      {dark ? <FiSun className="text-brand" /> : <FiMoon className="text-brand" />}
      <span>{dark ? "Light" : "Dark"}</span>
    </button>
  )
}
