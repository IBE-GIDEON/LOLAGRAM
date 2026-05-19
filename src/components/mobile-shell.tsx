import dynamic from "next/dynamic"
import type { PropsWithChildren } from "react"

import { BottomNav } from "@/components/bottom-nav"

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

export function MobileShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto flex min-h-screen w-full justify-center lg:px-6 lg:py-6">
        <main className="flex min-h-screen w-full max-w-[430px] flex-col bg-canvas lg:overflow-hidden lg:rounded-[36px] lg:border lg:border-border/60 lg:shadow-xl">
          <OfflineBanner />
          <GlobalCart />
          <div className="min-h-0 flex-1">{children}</div>
          <BottomNav />
        </main>
      </div>
    </div>
  )
}
