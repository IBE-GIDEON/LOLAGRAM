"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { FiMessageCircle } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { Badge, Button, Card, SectionHeading } from "@/components/ui"
import {
  ORDER_STATUS_META,
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META
} from "@/lib/constants"
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
  type PaymentStatus,
  type VendorDetail
} from "@/lib/types"

const statusSteps: OrderStatus[] = ["pending", "confirmed", "dispatched", "delivered"]

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

      if (!nextOrder?.vendorId || profile?.id !== nextOrder.buyerId) {
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
  }, [orderId, profile?.id])

  const isSellerViewer = Boolean(profile && vendorProfile && order?.vendorId === vendorProfile.id)
  const isBuyerViewer = Boolean(profile && order?.buyerId === profile.id)
  const canReview =
    isBuyerViewer &&
    order?.status === "delivered" &&
    !vendorData?.reviews.some((review) => review.orderId === order?.id)
  const archiveActor: OrderArchiveActor | null = isSellerViewer
    ? "seller"
    : isBuyerViewer
      ? "buyer"
      : null
  const canArchive =
    Boolean(archiveActor) &&
    (order?.status === "delivered" || order?.status === "cancelled")

  if (!order) {
    return <div className="p-4 text-sm text-muted">Loading order...</div>
  }

  const activeVendor = vendorData?.vendor ?? order.vendor
  const vendorName = activeVendor?.storeName ?? "Vendor"
  const whatsappNumber = activeVendor?.whatsappNumber
  const orderCounterpartyTitle = isSellerViewer ? "Store order" : vendorName
  const orderCounterpartyMeta = isSellerViewer
    ? "Confirm, collect payment if needed, then dispatch and deliver."
    : "Track seller updates and payment instructions in one place."
  const paymentMethodMeta = PAYMENT_METHOD_META[order.paymentMethod]
  const paymentStatusMeta = PAYMENT_STATUS_META[order.paymentStatus]
  const vendorTransferReady = Boolean(
    activeVendor?.bankName && activeVendor?.accountName && activeVendor?.accountNumber
  )

  const sellerCanConfirm = isSellerViewer && order.status === "pending"
  const sellerCanReject = isSellerViewer && order.status === "pending"
  const sellerCanMarkPaid =
    isSellerViewer &&
    order.paymentMethod === "vendor_transfer" &&
    order.status === "confirmed" &&
    order.paymentStatus !== "paid_to_vendor"
  const sellerCanDispatch =
    isSellerViewer &&
    order.status === "confirmed" &&
    (order.paymentMethod === "pay_on_delivery" || order.paymentStatus === "paid_to_vendor")
  const sellerCanDeliver = isSellerViewer && order.status === "dispatched"

  const applyOrderUpdate = async (
    updates: { status?: OrderStatus; paymentStatus?: PaymentStatus },
    successMessage: string
  ) => {
    const previousOrder = order
    setBusy(true)
    setOrder((current) => (current ? { ...current, ...updates } : current))

    try {
      await updateOrderStatus(order.id, updates)
      toast.success(successMessage)
    } catch (error) {
      setOrder(previousOrder)
      toast.error(
        error instanceof Error ? error.message : "Could not update this order."
      )
    } finally {
      setBusy(false)
    }
  }

  const sellerProgressMessage = useMemo(() => {
    if (!isSellerViewer) {
      return null
    }

    if (order.status === "cancelled") {
      return "This order is cancelled."
    }

    if (order.status === "delivered") {
      return "This order is already delivered."
    }

    if (order.paymentMethod === "vendor_transfer" && order.status === "confirmed") {
      return order.paymentStatus === "paid_to_vendor"
        ? "Direct payment is confirmed. You can dispatch the order now."
        : "Wait for the buyer to pay you directly, then mark payment received."
    }

    if (order.status === "dispatched") {
      return "The order is already on the way to the buyer."
    }

    return "Only your store can move this order forward. Buyers just see the updates."
  }, [isSellerViewer, order])

  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <SectionHeading title="Order detail" />

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-ink">{orderCounterpartyTitle}</p>
            <p className="mt-1 text-sm text-muted">{orderCounterpartyMeta}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
              {formatDateTime(order.createdAt)}
            </p>
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
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Delivery Address</p>
          <p className="mt-2 text-sm leading-6 text-ink">{order.deliveryAddress}</p>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-muted">Total</p>
          <p className="text-xl font-bold text-brand">{formatCurrency(order.totalAmount)}</p>
        </div>

        {isBuyerViewer && whatsappNumber ? (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-whatsapp/25 bg-surface px-4 py-3 text-sm font-semibold text-whatsapp"
          >
            <FiMessageCircle />
            Chat Seller on WhatsApp
          </a>
        ) : null}
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-canvas text-ink">{paymentMethodMeta.label}</Badge>
          <Badge className={paymentStatusMeta.className}>{paymentStatusMeta.label}</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">{paymentStatusMeta.helper}</p>

        {isBuyerViewer ? (
          <div className="mt-4 rounded-2xl bg-canvas p-4">
            {order.paymentMethod === "pay_on_delivery" ? (
              <p className="text-sm leading-6 text-ink">
                This seller will collect cash or transfer when the order arrives.
                Inspect it first before paying.
              </p>
            ) : order.paymentStatus === "awaiting_seller_confirmation" ? (
              <p className="text-sm leading-6 text-ink">
                Wait for the seller to confirm this order first. Once they do,
                their direct payment details will show here.
              </p>
            ) : vendorTransferReady ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Bank</span>
                  <span className="font-semibold text-ink">{activeVendor?.bankName}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Account name</span>
                  <span className="font-semibold text-ink">{activeVendor?.accountName}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Account number</span>
                  <span className="font-semibold text-ink">{activeVendor?.accountNumber}</span>
                </div>
                {activeVendor?.paymentNote ? (
                  <p className="mt-3 rounded-2xl bg-surface px-4 py-3 text-sm leading-6 text-muted">
                    {activeVendor.paymentNote}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm leading-6 text-ink">
                This seller has not added bank details yet. Use WhatsApp to agree on
                how you will complete direct payment.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-canvas p-4">
            <p className="text-sm leading-6 text-ink">
              {order.paymentMethod === "pay_on_delivery"
                ? "The buyer will pay when the order arrives."
                : order.paymentStatus === "paid_to_vendor"
                  ? "You already marked the buyer's direct payment as received."
                  : order.status === "pending"
                    ? "Confirm this order first so the buyer can see your direct payment instructions."
                    : "Wait for the buyer's transfer, then mark payment received."}
            </p>
          </div>
        )}
      </Card>

      {isBuyerViewer ? (
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink">Status timeline</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your seller updates this timeline as the order moves forward.
          </p>
          <div className="mt-4 space-y-3">
            {statusSteps.map((status, index) => {
              const reached = statusSteps.indexOf(order.status) >= index
              return (
                <div key={status} className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${reached ? "bg-brand" : "bg-border"}`}
                  />
                  <p className={reached ? "font-medium text-ink" : "text-muted"}>
                    {ORDER_STATUS_META[status].label}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}

      {isSellerViewer ? (
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink">Fulfil this order</p>
          <p className="mt-2 text-sm leading-6 text-muted">{sellerProgressMessage}</p>

          <div className="mt-4 flex flex-wrap gap-3">
            {sellerCanConfirm ? (
              <Button
                disabled={busy}
                onClick={() =>
                  applyOrderUpdate(
                    {
                      status: "confirmed",
                      paymentStatus:
                        order.paymentMethod === "vendor_transfer"
                          ? "awaiting_vendor_payment"
                          : "pay_on_delivery"
                    },
                    order.paymentMethod === "vendor_transfer"
                      ? "Order confirmed. Buyer can now pay you directly."
                      : "Order confirmed."
                  )
                }
              >
                Confirm Order
              </Button>
            ) : null}

            {sellerCanReject ? (
              <Button
                variant="outline"
                className="border-rose-200 text-rose-700 hover:border-rose-300 hover:text-rose-800"
                disabled={busy}
                onClick={() =>
                  applyOrderUpdate({ status: "cancelled" }, "Order cancelled.")
                }
              >
                Reject Order
              </Button>
            ) : null}

            {sellerCanMarkPaid ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  applyOrderUpdate(
                    { paymentStatus: "paid_to_vendor" },
                    "Direct payment marked as received."
                  )
                }
              >
                Mark Payment Received
              </Button>
            ) : null}

            {sellerCanDispatch ? (
              <Button
                disabled={busy}
                onClick={() =>
                  applyOrderUpdate({ status: "dispatched" }, "Order marked dispatched.")
                }
              >
                Mark Dispatched
              </Button>
            ) : null}

            {sellerCanDeliver ? (
              <Button
                disabled={busy}
                onClick={() =>
                  applyOrderUpdate({ status: "delivered" }, "Order marked delivered.")
                }
              >
                Mark Delivered
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {isBuyerViewer && canReview ? (
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
                  comment: reviewComment,
                  buyerName: profile.fullName
                })

                const nextReview = {
                  id: `review-${order.id}`,
                  orderId: order.id,
                  buyerId: profile.id,
                  vendorId: order.vendorId,
                  rating: reviewRating,
                  comment: reviewComment,
                  createdAt: new Date().toISOString(),
                  buyerName: profile.fullName.split(/\s+/)[0] ?? profile.fullName
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
                    (current.averageRating * current.reviewCount + reviewRating) / nextCount

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
                toast.error(error instanceof Error ? error.message : "Could not save review.")
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
            {isSellerViewer
              ? "Remove this finished order from your store history only. The buyer keeps their own copy."
              : "Remove this finished order from your purchase history only. The seller keeps their own copy."}
          </p>
          <Button
            variant="outline"
            className="mt-4 w-full"
            disabled={busy}
            onClick={async () => {
              const confirmed = window.confirm("Remove this completed order from your history?")
              if (!confirmed) return

              setBusy(true)
              try {
                const result = await archiveCompletedOrder(order.id, archiveActor!, profile.id)
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
