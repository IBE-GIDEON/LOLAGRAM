"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"

import { useAuth } from "@/components/providers/auth-provider"
import { Badge, Button, Card, SectionHeading } from "@/components/ui"
import { ORDER_STATUS_META, PAYMENT_METHOD_META, PAYMENT_STATUS_META } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  archiveCompletedOrder,
  loadBuyerOrders,
  loadSellerOrders,
  peekCachedBuyerOrders,
  peekCachedSellerOrders
} from "@/lib/marketplace"
import { type OrderDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

type OrdersMode = "purchases" | "store"

export function OrdersPageClient() {
  const { loading, profile, vendorProfile } = useAuth()
  const [mode, setMode] = useState<OrdersMode>("purchases")
  const [orders, setOrders] = useState<OrderDetail[]>(() =>
    profile ? peekCachedBuyerOrders(profile.id) : []
  )
  const [fetching, setFetching] = useState(
    () => loading || (profile ? peekCachedBuyerOrders(profile.id).length === 0 : true)
  )
  const [archivingOrderId, setArchivingOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) {
      return
    }

    const cachedOrders =
      mode === "store" && vendorProfile
        ? peekCachedSellerOrders(profile.id)
        : peekCachedBuyerOrders(profile.id)

    if (cachedOrders.length > 0) {
      setOrders(cachedOrders)
      setFetching(false)
    }
  }, [mode, profile, vendorProfile])

  useEffect(() => {
    if (!profile) {
      setFetching(false)
      return
    }

    let ignore = false
    setFetching(true)
    const request =
      mode === "store" && vendorProfile
        ? loadSellerOrders(profile.id)
        : loadBuyerOrders(profile.id)

    request
      .then((nextOrders) => {
        if (ignore) return
        setOrders(nextOrders)
      })
      .finally(() => {
        if (!ignore) {
          setFetching(false)
        }
      })

    if (vendorProfile) {
      void (mode === "store" ? loadBuyerOrders(profile.id) : loadSellerOrders(profile.id))
    }

    return () => {
      ignore = true
    }
  }, [mode, profile, vendorProfile])

  if (loading) {
    return <div className="p-4 text-sm text-muted">Loading orders...</div>
  }

  if (!profile) {
    return (
      <div className="space-y-4 p-4 pb-safe-nav">
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
    <div className="space-y-4 p-4 pb-safe-nav">
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
              ? "Incoming store orders will appear here as soon as buyers place orders."
              : "Your first order will show up here with payment details and a live status timeline."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="p-4 transition hover:bg-canvas">
              <Link href={`/orders/${order.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {mode === "store"
                        ? order.buyer?.fullName ?? "Customer order"
                        : order.vendor?.storeName ?? "Vendor order"}
                    </p>
                    <p className="mt-1 text-sm text-muted">{formatDate(order.createdAt)}</p>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {PAYMENT_METHOD_META[order.paymentMethod].label} ·{" "}
                      {PAYMENT_STATUS_META[order.paymentStatus].label}
                    </p>
                    <p className="mt-2 text-base font-bold text-brand">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <Badge className={ORDER_STATUS_META[order.status].className}>
                    {ORDER_STATUS_META[order.status].label}
                  </Badge>
                </div>
              </Link>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:bg-canvas"
                >
                  Open order
                </Link>

                {(order.status === "delivered" || order.status === "cancelled") && profile ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={archivingOrderId === order.id}
                    onClick={async () => {
                      const actor = mode === "store" ? "seller" : "buyer"
                      const confirmed = window.confirm(
                        mode === "store"
                          ? "Remove this order from your store history only?"
                          : "Remove this order from your purchase history only?"
                      )

                      if (!confirmed) return

                      setArchivingOrderId(order.id)
                      try {
                        const result = await archiveCompletedOrder(
                          order.id,
                          actor,
                          profile.id
                        )
                        setOrders((current) =>
                          current.filter((currentOrder) => currentOrder.id !== order.id)
                        )
                        toast.success(
                          result.localOnly
                            ? "Removed from this device only for now."
                            : mode === "store"
                              ? "Removed from your store history."
                              : "Removed from your purchase history."
                        )
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Could not remove this order from history."
                        )
                      } finally {
                        setArchivingOrderId(null)
                      }
                    }}
                  >
                    {mode === "store" ? "Remove store copy" : "Remove purchase copy"}
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
