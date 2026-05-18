import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import { MobileShell } from "@/components/mobile-shell"
import { AppProviders } from "@/components/providers/app-providers"
import { SplashScreen } from "@/components/splash-screen"
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
        {/* Theme script — runs synchronously before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        {/* Splash — client component so React fully owns its lifecycle */}
        <SplashScreen />

        <AppProviders>
          <MobileShell>{children}</MobileShell>
        </AppProviders>
      </body>
    </html>
  )
}
