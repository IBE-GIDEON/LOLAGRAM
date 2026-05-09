import type { PropsWithChildren } from "react"

import { BottomNav } from "@/components/bottom-nav"
import { OfflineBanner } from "@/components/offline-banner"

export function MobileShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto flex min-h-screen max-w-[1180px] lg:gap-6 lg:px-6 lg:py-6">
        <aside className="hidden flex-1 rounded-[34px] bg-panel px-10 py-14 text-ink lg:flex lg:flex-col lg:justify-between lg:border lg:border-border/60">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">LOLAGRAM</p>
            <h1 className="mt-4 max-w-sm text-4xl font-bold leading-tight">
              Download the app and shop your favourite Nigerian vendors like you
              are opening WhatsApp.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-muted">
              One installable marketplace for buyers and sellers. Browse stores,
              chat on WhatsApp, manage orders, and keep your storefront live from
              the same mobile-first app.
            </p>
          </div>
          <div className="rounded-[28px] bg-surface p-6 shadow-soft">
            <p className="text-sm font-semibold text-ink">PWA Ready</p>
            <p className="mt-2 text-sm text-muted">
              Add LOLAGRAM to your Android home screen for fast launch, offline
              vendor browsing, and order updates through push notifications.
            </p>
          </div>
        </aside>
        <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-canvas lg:overflow-hidden lg:rounded-[36px] lg:border lg:border-border/60 lg:shadow-xl">
          <OfflineBanner />
          <div className="min-h-0 flex-1">{children}</div>
          <BottomNav />
        </main>
      </div>
    </div>
  )
}
