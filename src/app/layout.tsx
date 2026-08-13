import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import { MobileShell } from "@/components/mobile-shell"
import { AppProviders } from "@/components/providers/app-providers"
import { SplashScreen } from "@/components/splash-screen"
import { getAppUrl } from "@/lib/app-url"
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

const APP_URL = getAppUrl()

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
})

const ICON_VERSION = "20260813-afunwa-logo"

const APP_TITLE = "Afunwa Hairline Global — Wigs, Bundles & Closures"
const APP_DESCRIPTION =
  "Lace fronts, bone straight, curls, braids and closures — picked, checked and delivered across Nigeria."

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Afunwa",
  description: APP_DESCRIPTION,
  applicationName: "Afunwa",
  keywords: ["wigs", "hair", "lace front", "closure", "frontal", "bundles", "Nigeria"],
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
    title: "Afunwa"
  },
  openGraph: {
    type: "website",
    siteName: "Afunwa Hairline Global",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [
      {
        url: `${APP_URL}/pwa/icon-512.png`,
        width: 512,
        height: 512,
        alt: "Afunwa Hairline Global logo"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/pwa/icon-512.png`]
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#401020" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1419" }
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
        var isDark = stored ? stored === "dark" : false;
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
