"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react"

import { THEME_KEY } from "@/lib/constants"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const nextTheme =
      stored === "dark" || stored === "light"
        ? stored
        : preferredDark
          ? "dark"
          : "dark"

    setThemeState(nextTheme)
    applyTheme(nextTheme)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme(nextTheme) {
        setThemeState(nextTheme)
        window.localStorage.setItem(THEME_KEY, nextTheme)
        applyTheme(nextTheme)
      },
      toggleTheme() {
        const nextTheme = theme === "dark" ? "light" : "dark"
        setThemeState(nextTheme)
        window.localStorage.setItem(THEME_KEY, nextTheme)
        applyTheme(nextTheme)
      }
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return value
}
