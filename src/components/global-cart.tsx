"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { FiShoppingBag, FiTrash2 } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"
import { BottomSheet, Button, Card } from "@/components/ui"
import { PAYMENT_METHOD_META } from "@/lib/constants"
import { formatCurrency } from "@/lib/format"
import { loadVendorDetail, placeOrder } from "@/lib/marketplace"
import { getPrimaryProductImage } from "@/lib/product-images"
import { queueOfflineOrder } from "@/lib/offline-orders"
import { type PaymentMethod, type VendorDetail } from "@/lib/types"

export function GlobalCart() {
  const router = useRouter()
  const { profile } = useAuth()
  const {
    vendorId,
    items,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal
  } = useCart()
  const [open, setOpen] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [vendorData, setVendorData] = useState<VendorDetail | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pay_on_delivery")

  useEffect(() => {
    if (!vendorId) {
      setVendorData(null)
      setOpen(false)
      return
    }

    loadVendorDetail(vendorId).then(setVendorData)
  }, [vendorId])

  const productMap = useMemo(() => {
    return new Map(
      (vendorData?.products ?? []).map((product) => [product.id, product] as const)
    )
  }, [vendorData?.products])

  const vendorTransferReady = Boolean(
    vendorData?.vendor.bankName &&
      vendorData?.vendor.accountName &&
      vendorData?.vendor.accountNumber
  )

  useEffect(() => {
    if (paymentMethod === "vendor_transfer" && !vendorTransferReady) {
      setPaymentMethod("pay_on_delivery")
    }
  }, [paymentMethod, vendorTransferReady])

  if (!vendorId || itemCount === 0) {
    return null
  }

  const handleCheckout = async () => {
    if (!profile) {
      toast.error("Sign in from Profile before placing an order.")
      return
    }

    if (!deliveryAddress.trim()) {
      toast.error("Add a delivery address to continue.")
      return
    }

    const payload = {
      buyerId: profile.id,
      vendorId,
      items,
      totalAmount: subtotal,
      deliveryAddress,
      paymentMethod
    }

    if (!navigator.onLine) {
      await queueOfflineOrder(payload)
      clearCart()
      setOpen(false)
      toast.success("Order queued. We'll sync it once you're back online.")
      return
    }

    setSubmitting(true)
    try {
      const response = await placeOrder(payload)
      clearCart()
      setOpen(false)
      router.push(`/order-confirmation/${response.orderId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place order.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+74px)] z-40 flex justify-center px-4">
        <button
          className="pointer-events-auto inline-flex min-w-[168px] items-center justify-between gap-3 rounded-full bg-chrome px-5 py-3 text-sm font-semibold text-brand shadow-lg"
          onClick={() => setOpen(true)}
        >
          <span className="inline-flex items-center gap-2">
            <FiShoppingBag />
            Cart
          </span>
          <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-chrome">
            {itemCount}
          </span>
        </button>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Your cart">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {vendorData?.vendor.storeName ?? "Vendor cart"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Orders in one cart stay with one vendor at a time.
                </p>
              </div>
              <Link
                href={`/vendor/${vendorId}`}
                className="text-xs font-semibold text-brand"
                onClick={() => setOpen(false)}
              >
                View store
              </Link>
            </div>
          </Card>

          {items.map((item) => {
            const product = productMap.get(item.productId)
            return (
              <Card key={item.productId} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-canvas">
                    {product && getPrimaryProductImage(product) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getPrimaryProductImage(product)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{item.name}</p>
                        <p className="mt-1 text-sm text-muted">
                          {formatCurrency(item.price)} each
                        </p>
                      </div>
                      <button
                        className="rounded-full p-2 text-muted transition hover:bg-canvas hover:text-rose-600"
                        onClick={() => removeItem(item.productId)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 rounded-full bg-canvas px-2 py-1">
                        <button
                          className="h-8 w-8 rounded-full bg-surface text-base text-ink"
                          onClick={() =>
                            updateQuantity(item.productId, Math.max(0, item.quantity - 1))
                          }
                        >
                          -
                        </button>
                        <span className="min-w-[24px] text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          className="h-8 w-8 rounded-full bg-surface text-base text-ink"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm font-bold text-brand">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}

          <Card className="p-4">
            <p className="text-sm font-semibold text-ink">Delivery address</p>
            <textarea
              className="mt-3 min-h-[96px] w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand/40"
              placeholder="Enter your delivery address"
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
            />

            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-ink">Choose how you want to pay</p>
              <div className="space-y-2">
                {(["pay_on_delivery", "vendor_transfer"] as PaymentMethod[]).map((method) => {
                  const methodMeta = PAYMENT_METHOD_META[method]
                  const disabled = method === "vendor_transfer" && !vendorTransferReady

                  return (
                    <button
                      key={method}
                      type="button"
                      disabled={disabled}
                      className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                        paymentMethod === method
                          ? "border-brand/40 bg-brand/5"
                          : "border-border bg-surface"
                      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{methodMeta.label}</p>
                        {paymentMethod === method ? (
                          <span className="rounded-full bg-chrome px-2.5 py-1 text-[10px] font-semibold text-white">
                            Selected
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {disabled
                          ? "This seller has not added direct payment details yet."
                          : methodMeta.helper}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted">Subtotal</p>
              <p className="text-lg font-bold text-brand">
                {formatCurrency(subtotal)}
              </p>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={handleCheckout}
              disabled={submitting}
            >
              {submitting ? "Placing order..." : "Place Order"}
            </Button>
            <p className="mt-3 text-xs leading-5 text-muted">
              {paymentMethod === "pay_on_delivery"
                ? "You will inspect the order first and pay when it arrives."
                : "You only pay the seller directly after they confirm the order."}
            </p>
            {!profile ? (
              <p className="mt-3 text-xs text-muted">
                Sign in from{" "}
                <Link href="/profile" className="font-semibold text-brand" onClick={() => setOpen(false)}>
                  Profile
                </Link>{" "}
                before placing an order.
              </p>
            ) : null}
          </Card>
        </div>
      </BottomSheet>
    </>
  )
}
