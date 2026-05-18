import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import { MobileShell } from "@/components/mobile-shell"
import { AppProviders } from "@/components/providers/app-providers"
import { THEME_KEY } from "@/lib/constants"

import "@/app/globals.css"

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      } catch {
        return null
      }
    })()
  : null

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
})

const ICON_VERSION = "20260514-pwa"

const APP_TITLE = "LOLAGRAM — Your Local Marketplace"
const APP_DESCRIPTION =
  "Discover local vendors, shop products, and track your orders — all in one place. Nigeria's WhatsApp-style marketplace."

export const metadata: Metadata = {
  title: "LOLAGRAM",
  description: APP_DESCRIPTION,
  applicationName: "LOLAGRAM",
  keywords: ["marketplace", "Nigeria", "vendors", "shop", "buy", "sell", "local"],
  icons: {
    icon: [
      { url: `/favicon.ico?v=${ICON_VERSION}`, sizes: "any" },
      { url: `/icons/icon-64.png?v=${ICON_VERSION}`, sizes: "64x64", type: "image/png" },
      { url: `/icons/icon-128.png?v=${ICON_VERSION}`, sizes: "128x128", type: "image/png" }
    ],
    apple: [
      {
        url: `/icons/apple-icon-180.png?v=${ICON_VERSION}`,
        sizes: "180x180",
        type: "image/png"
      }
    ],
    shortcut: [{ url: `/favicon.ico?v=${ICON_VERSION}`, sizes: "any" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LOLAGRAM"
  },
  openGraph: {
    type: "website",
    siteName: "LOLAGRAM",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/pwa/icon-512.png",
        width: 512,
        height: 512,
        alt: "LOLAGRAM logo"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: ["/pwa/icon-512.png"]
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#25D366" },
    { media: "(prefers-color-scheme: dark)", color: "#111B21" }
  ]
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  // Runs synchronously before first paint — sets dark/light class on <html>
  const themeScript = `
    (function () {
      try {
        var stored = window.localStorage.getItem("${THEME_KEY}");
        var isDark = stored ? stored === "dark" : true;
        document.documentElement.classList.toggle("dark", isDark);
      } catch (e) {}
    })();
  `

  // Adjusts splash bg for light-mode users, then fades it out on load
  const splashScript = `
    (function () {
      try {
        var stored = window.localStorage.getItem("${THEME_KEY}");
        var isDark = stored ? stored === "dark" : true;
        var splash = document.getElementById("lolagram-splash");
        if (splash && !isDark) {
          splash.style.background = "#EAEFEB";
          var title = document.getElementById("lolagram-splash-title");
          if (title) title.style.color = "#111B21";
        }
        function removeSplash() {
          var s = document.getElementById("lolagram-splash");
          if (!s) return;
          s.style.transition = "opacity 0.35s ease";
          s.style.opacity = "0";
          setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 400);
        }
        if (document.readyState === "complete") {
          setTimeout(removeSplash, 250);
        } else {
          window.addEventListener("load", function () {
            setTimeout(removeSplash, 250);
          }, { once: true });
        }
      } catch (e) {}
    })();
  `

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        {/* Google Fonts — Inter is loaded from here via next/font */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Supabase API origin */}
        {supabaseOrigin ? (
          <>
            <link rel="preconnect" href={supabaseOrigin} />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        ) : null}

        {/* Preload the splash / PWA icon so it's ready before JS hydrates */}
        <link
          rel="preload"
          href="/favicon.ico"
          as="image"
          type="image/x-icon"
        />
      </head>
      <body>
        {/* ── Splash screen ─────────────────────────────────────────────────── */}
        {/* Rendered server-side so it appears immediately on every cold launch. */}
        {/* The splashScript below adjusts bg for light-mode then fades it out. */}
        <div
          id="lolagram-splash"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#08131A",
            pointerEvents: "none"
          }}
        >
          {/* App icon */}
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
            id="lolagram-splash-title"
            style={{
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#E8EDF0",
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

        {/* Synchronous scripts — run before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: splashScript }} />

        <AppProviders>
          <MobileShell>{children}</MobileShell>
        </AppProviders>
      </body>
    </html>
  )
}
