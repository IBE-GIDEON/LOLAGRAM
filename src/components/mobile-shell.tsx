import dynamic from "next/dynamic"
import type { PropsWithChildren } from "react"

import { BottomNav } from "@/components/bottom-nav"
import { DesktopNav } from "@/components/desktop-nav"
import { FloatingWhatsApp } from "@/components/floating-whatsapp"

// OfflineBanner: only visible when device is offline — skip from initial bundle
const OfflineBanner = dynamic(
  () => import("@/components/offline-banner").then((m) => m.OfflineBanner),
  { ssr: false, loading: () => null }
)

// GlobalCart: only when a user has items in their cart
const GlobalCart = dynamic(
  () => import("@/components/global-cart").then((m) => m.GlobalCart),
  { ssr: false }
)

/**
 * One shell, two layouts: a phone-width app with a bottom nav below lg, and a
 * full-width storefront with a top nav from lg up.
 */
export function MobileShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto flex min-h-screen w-full justify-center">
        <main className="flex min-h-screen w-full max-w-[430px] flex-col bg-canvas lg:max-w-none">
          <DesktopNav />
          <OfflineBanner />
          <GlobalCart />
          <FloatingWhatsApp />
          <div className="min-h-0 flex-1">{children}</div>
          <BottomNav />
        </main>
      </div>
    </div>
  )
}
