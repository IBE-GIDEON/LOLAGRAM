"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { useAuth } from "@/components/providers/auth-provider"
import { Badge, Card, SectionHeading } from "@/components/ui"
import { ORDER_STATUS_META } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/format"
import { loadBuyerOrders, loadSellerOrders } from "@/lib/marketplace"
import { type OrderDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

type OrdersMode = "purchases" | "store"

export function OrdersPageClient() {
  const { loading, profile, vendorProfile } = useAuth()
  const [mode, setMode] = useState<OrdersMode>("purchases")
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!profile) {
      setFetching(false)
      return
    }

    setFetching(true)
    const request =
      mode === "store" && vendorProfile
        ? loadSellerOrders(profile.id)
        : loadBuyerOrders(profile.id)

    request.then(setOrders).finally(() => setFetching(false))
  }, [mode, profile, vendorProfile])

  if (loading) {
    return <div className="p-4 text-sm text-muted">Loading orders...</div>
  }

  if (!profile) {
    return (
      <div className="space-y-4 p-4">
        <SectionHeading title="Orders" />
        <Card className="p-5">
          <p className="text-lg font-semibold text-ink">Sign in to view your orders</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your purchase history, delivery status, and store orders live here.
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-flex rounded-full bg-chrome px-4 py-3 text-sm font-semibold text-white"
          >
            Go to Profile
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <SectionHeading title="Orders" />

      {vendorProfile ? (
        <div className="grid grid-cols-2 rounded-full border border-border/70 bg-surface p-1 shadow-soft">
          <button
            className={cn(
              "rounded-full px-4 py-3 text-sm font-semibold transition",
              mode === "purchases" ? "bg-chrome text-white" : "text-muted"
            )}
            onClick={() => setMode("purchases")}
          >
            My Purchases
          </button>
          <button
            className={cn(
              "rounded-full px-4 py-3 text-sm font-semibold transition",
              mode === "store" ? "bg-chrome text-white" : "text-muted"
            )}
            onClick={() => setMode("store")}
          >
            My Store Orders
          </button>
        </div>
      ) : null}

      {fetching ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-[26px] bg-surface shadow-soft" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-5">
          <p className="text-lg font-semibold text-ink">No orders yet</p>
          <p className="mt-2 text-sm text-muted">
            {mode === "store"
              ? "Incoming store orders will appear here as soon as buyers checkout."
              : "Your first checkout will show up here with a live status timeline."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="p-4 transition hover:bg-canvas">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {mode === "store"
                        ? order.buyer?.fullName ?? "Buyer order"
                        : order.vendor?.storeName ?? "Vendor order"}
                    </p>
                    <p className="mt-1 text-sm text-muted">{formatDate(order.createdAt)}</p>
                    <p className="mt-2 text-base font-bold text-brand">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <Badge className={ORDER_STATUS_META[order.status].className}>
                    {ORDER_STATUS_META[order.status].label}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
