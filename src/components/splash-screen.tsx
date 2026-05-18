"use client"

import { useEffect, useState } from "react"

const SESSION_KEY = "lolagram-splash"

/**
 * Splash screen shown only on a genuine cold start (fresh page load).
 *
 * Why a client component?
 * The root layout in Next.js App Router is a *persistent shell* — it does
 * NOT re-render on client-side navigation. Once this component's state
 * becomes `visible = false` it stays false for the entire session, so the
 * splash can never bleed into product clicks, tab changes, or any other
 * in-app navigation.
 *
 * The `sessionStorage` guard is an extra safety net: if the layout ever
 * does re-mount (e.g. hard-refresh mid-session), it ensures the splash
 * only shows once per browser session.
 */
export function SplashScreen() {
  // Default true so the SSR HTML includes the visible splash immediately —
  // no flash on cold start before JS runs.
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Already shown this browser session — hide instantly (no flash because
    // the layout shell doesn't re-render on client-side navigation).
    if (sessionStorage.getItem(SESSION_KEY)) {
      setVisible(false)
      return
    }
    sessionStorage.setItem(SESSION_KEY, "1")

    // First real load — fade out after the page finishes loading.
    function hide() {
      setVisible(false)
    }

    if (document.readyState === "complete") {
      const t = setTimeout(hide, 300)
      return () => clearTimeout(t)
    }

    window.addEventListener("load", function onLoad() {
      setTimeout(hide, 300)
    }, { once: true })
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none"
      }}
      // Tailwind dark-mode classes — html[class=dark] is set by themeScript
      // before this element paints, so the correct colour shows on first frame.
      className="bg-[#EAEFEB] dark:bg-[#08131A]"
    >
      {/* Icon */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
          boxShadow: "0 8px 32px rgba(37,211,102,0.35)"
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon.ico"
          alt=""
          width={70}
          height={70}
          style={{ borderRadius: 16, display: "block" }}
        />
      </div>

      {/* App name */}
      <p
        className="text-[#111B21] dark:text-[#E8EDF0]"
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "0.1em",
          margin: 0,
          lineHeight: 1
        }}
      >
        LOLAGRAM
      </p>

      {/* Tagline */}
      <p
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 13,
          color: "#8696A0",
          margin: "10px 0 0",
          letterSpacing: "0.02em"
        }}
      >
        Your local marketplace
      </p>
    </div>
  )
}
