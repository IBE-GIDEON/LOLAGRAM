"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { FiMessageCircle } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { Badge, Button, Card, SectionHeading } from "@/components/ui"
import { ORDER_STATUS_META } from "@/lib/constants"
import { formatCurrency, formatDateTime } from "@/lib/format"
import {
  archiveCompletedOrder,
  loadOrderDetail,
  loadVendorDetail,
  saveReview,
  updateOrderStatus
} from "@/lib/marketplace"
import {
  type OrderArchiveActor,
  type OrderDetail,
  type OrderStatus,
  type VendorDetail
} from "@/lib/types"

const statusSteps: OrderStatus[] = [
  "pending",
  "confirmed",
  "dispatched",
  "delivered"
]

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const { profile, vendorProfile } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [vendorData, setVendorData] = useState<VendorDetail | null>(null)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let ignore = false

    async function hydrateOrder() {
      const nextOrder = await loadOrderDetail(orderId)
      if (ignore) return

      setOrder(nextOrder)

      if (!nextOrder?.vendorId) {
        setVendorData(null)
        return
      }

      const nextVendorData = await loadVendorDetail(nextOrder.vendorId)
      if (!ignore) {
        setVendorData(nextVendorData)
      }
    }

    void hydrateOrder()

    return () => {
      ignore = true
    }
  }, [orderId])

  const canManage = profile && vendorProfile && order?.vendorId === vendorProfile.id
  const canReview =
    profile &&
    order?.buyerId === profile.id &&
    order.status === "delivered" &&
    !vendorData?.reviews.some((review) => review.orderId === order.id)
  const archiveActor: OrderArchiveActor | null = canManage
    ? "seller"
    : profile && order?.buyerId === profile.id
      ? "buyer"
      : null
  const canArchive =
    Boolean(archiveActor) &&
    (order?.status === "delivered" || order?.status === "cancelled")

  const nextActions = useMemo(() => {
    if (!order) return []
    if (order.status === "pending") return ["confirmed"] as OrderStatus[]
    if (order.status === "confirmed") return ["dispatched"] as OrderStatus[]
    if (order.status === "dispatched") return ["delivered"] as OrderStatus[]
    return []
  }, [order])

  if (!order) {
    return <div className="p-4 text-sm text-muted">Loading order...</div>
  }

  const vendorName = vendorData?.vendor.storeName ?? order.vendor?.storeName ?? "Vendor"
  const whatsappNumber = vendorData?.vendor.whatsappNumber

  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <SectionHeading title="Order detail" />

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-ink">{vendorName}</p>
            <p className="mt-1 text-sm text-muted">{formatDateTime(order.createdAt)}</p>
          </div>
          <Badge className={ORDER_STATUS_META[order.status].className}>
            {ORDER_STATUS_META[order.status].label}
          </Badge>
        </div>

        <div className="mt-5 space-y-3">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-ink">{item.name}</p>
                <p className="text-muted">Qty {item.quantity}</p>
              </div>
              <p className="font-semibold text-brand">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-canvas p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Delivery Address
          </p>
          <p className="mt-2 text-sm leading-6 text-ink">{order.deliveryAddress}</p>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-muted">Total</p>
          <p className="text-xl font-bold text-brand">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>

        {whatsappNumber ? (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-whatsapp/25 bg-surface px-4 py-3 text-sm font-semibold text-whatsapp"
          >
            <FiMessageCircle />
            Vendor WhatsApp
          </a>
        ) : null}
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold text-ink">Status timeline</p>
        <div className="mt-4 space-y-3">
          {statusSteps.map((status, index) => {
            const reached = statusSteps.indexOf(order.status) >= index
            return (
              <div key={status} className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    reached ? "bg-brand" : "bg-border"
                  }`}
                />
                <p className={reached ? "font-medium text-ink" : "text-muted"}>
                  {ORDER_STATUS_META[status].label}
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      {canManage && nextActions.length > 0 ? (
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink">Update order status</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {nextActions.map((status) => (
              <Button
                key={status}
                onClick={async () => {
                  const previousStatus = order.status
                  setBusy(true)
                  setOrder((current) =>
                    current ? { ...current, status } : current
                  )

                  try {
                    await updateOrderStatus(order.id, status)
                    toast.success(`Order marked ${ORDER_STATUS_META[status].label}.`)
                  } catch (error) {
                    setOrder((current) =>
                      current ? { ...current, status: previousStatus } : current
                    )
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Could not update this order."
                    )
                  } finally {
                    setBusy(false)
                  }
                }}
                disabled={busy}
              >
                {status === "confirmed"
                  ? "Confirm Order"
                  : status === "dispatched"
                    ? "Mark Dispatched"
                    : "Mark Delivered"}
              </Button>
            ))}
          </div>
        </Card>
      ) : null}

      {canReview ? (
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink">Leave a review</p>
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <button
                key={index}
                className={`rounded-full px-3 py-2 text-sm ${
                  reviewRating >= index + 1 ? "bg-chrome text-white" : "bg-canvas text-muted"
                }`}
                onClick={() => setReviewRating(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <textarea
            className="mt-4 min-h-[110px] w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand/40"
            placeholder="Tell other buyers how it went"
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
          />
          <Button
            className="mt-4 w-full"
            onClick={async () => {
              if (!profile) return
              setBusy(true)
              try {
                await saveReview({
                  orderId: order.id,
                  buyerId: profile.id,
                  vendorId: order.vendorId,
                  rating: reviewRating,
                  comment: reviewComment
                })

                const nextReview = {
                  id: `review-${order.id}`,
                  orderId: order.id,
                  buyerId: profile.id,
                  vendorId: order.vendorId,
                  rating: reviewRating,
                  comment: reviewComment,
                  createdAt: new Date().toISOString(),
                  buyerName: profile.fullName
                }

                setVendorData((current) => {
                  if (!current) {
                    const nextAverage = reviewRating
                    const baseVendor = order.vendor
                    if (!baseVendor) return current

                    return {
                      vendor: {
                        ...baseVendor,
                        rating: nextAverage
                      },
                      products: [],
                      reviews: [nextReview],
                      reviewCount: 1,
                      averageRating: nextAverage
                    }
                  }

                  const nextCount = current.reviewCount + 1
                  const nextAverage =
                    (current.averageRating * current.reviewCount + reviewRating) /
                    nextCount

                  return {
                    ...current,
                    vendor: {
                      ...current.vendor,
                      rating: nextAverage
                    },
                    reviews: [nextReview, ...current.reviews].slice(0, 5),
                    reviewCount: nextCount,
                    averageRating: nextAverage
                  }
                })

                setReviewComment("")
                toast.success("Thanks for the review.")
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Could not save review."
                )
              } finally {
                setBusy(false)
              }
            }}
            disabled={busy}
          >
            Submit Review
          </Button>
        </Card>
      ) : null}

      {canArchive && profile ? (
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink">History</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Remove finished orders from your visible history without affecting the
            other person&apos;s records.
          </p>
          <Button
            variant="outline"
            className="mt-4 w-full"
            disabled={busy}
            onClick={async () => {
              const confirmed = window.confirm(
                "Remove this completed order from your history?"
              )
              if (!confirmed) return

              setBusy(true)
              try {
                const result = await archiveCompletedOrder(
                  order.id,
                  archiveActor!,
                  profile.id
                )
                toast.success(
                  result.localOnly
                    ? "Order removed from this device history."
                    : "Order removed from your history."
                )
                router.push("/orders")
                router.refresh()
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Could not remove this order from history."
                )
              } finally {
                setBusy(false)
              }
            }}
          >
            Remove from history
          </Button>
        </Card>
      ) : null}
    </div>
  )
}
