import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import { MobileShell } from "@/components/mobile-shell"
import { AppProviders } from "@/components/providers/app-providers"
import { THEME_KEY } from "@/lib/constants"

import "@/app/globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
})

const ICON_VERSION = "20260514-pwa"

export const metadata: Metadata = {
  title: "LOLAGRAM",
  description:
    "Mobile-first Nigerian marketplace for buyers and sellers with a WhatsApp-style vendor list.",
  applicationName: "LOLAGRAM",
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
  const themeScript = `
    (function () {
      try {
        var stored = window.localStorage.getItem("${THEME_KEY}");
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var isDark = stored ? stored === "dark" : true;
        document.documentElement.classList.toggle("dark", isDark);
      } catch (error) {}
    })();
  `

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AppProviders>
          <MobileShell>{children}</MobileShell>
        </AppProviders>
      </body>
    </html>
  )
}
