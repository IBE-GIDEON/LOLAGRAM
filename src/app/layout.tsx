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

export const metadata: Metadata = {
  title: "LOLAGRAM",
  description:
    "Mobile-first Nigerian marketplace for buyers and sellers with a WhatsApp-style vendor list.",
  applicationName: "LOLAGRAM",
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
  themeColor: "#C0392B"
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
        var isDark = stored ? stored === "dark" : prefersDark;
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
