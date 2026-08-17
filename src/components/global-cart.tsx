"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { FiShoppingBag, FiTrash2 } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"
import { RemoteImage } from "@/components/remote-image"
import { BottomSheet, Button, Card } from "@/components/ui"
import { PAYMENT_METHOD_META } from "@/lib/constants"
import { PAY_ON_DELIVERY_ENABLED } from "@/lib/feature-flags"
import { hasFlutterwave } from "@/lib/env"
import { useLocale } from "@/components/providers/locale-provider"
import {
  loadVendorDetail,
  placeOrder,
  saveUserProfile,
  startCardCheckout
} from "@/lib/marketplace"
import { getPrimaryProductImage } from "@/lib/product-images"
import { queueOfflineOrder } from "@/lib/offline-orders"
import { type PaymentMethod, type VendorDetail } from "@/lib/types"

/**
 * Direct payment is the only route while Pay on Delivery is switched off. The
 * list drives both the buttons and the default, so the selected method can
 * never be one the buyer was not shown.
 */
const PAYMENT_METHODS: PaymentMethod[] = [
  // Card first: it is the only one that settles before the parcel moves.
  ...(hasFlutterwave ? (["flutterwave"] as PaymentMethod[]) : []),
  "vendor_transfer",
  ...(PAY_ON_DELIVERY_ENABLED ? (["pay_on_delivery"] as PaymentMethod[]) : [])
]

export function GlobalCart() {
  const router = useRouter()
  const { profile, refreshProfile } = useAuth()
  const {
    vendorId,
    items,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal
  } = useCart()
  const { money } = useLocale()
  const [open, setOpen] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [vendorData, setVendorData] = useState<VendorDetail | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PAYMENT_METHODS[0]
  )

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

  if (!vendorId || itemCount === 0) {
    return null
  }

  const handleCheckout = async () => {
    if (!profile) {
      toast.error("Sign in to place your order.")
      router.push("/login?next=/")
      return
    }

    if (!deliveryAddress.trim()) {
      toast.error("Add a delivery address to continue.")
      return
    }

    // Signup no longer asks for a phone number, so we collect it on the first
    // order — the seller needs it to reach the buyer on WhatsApp.
    const normalizedPhone = normalizeNigerianPhone(phone)

    if (!profile.phone?.trim()) {
      if (!normalizedPhone) {
        toast.error("Add the phone number the seller should call you on.")
        return
      }

      try {
        await saveUserProfile({ ...profile, phone: normalizedPhone })
        await refreshProfile(profile.id)
      } catch {
        toast.error("Could not save your phone number. Check it and try again.")
        return
      }
    }

    const payload = {
      buyerId: profile.id,
      vendorId,
      items,
      totalAmount: subtotal,
      deliveryAddress,
      paymentMethod
    }

    if (!navigator.onLine && paymentMethod === "flutterwave") {
      toast.error("Card checkout needs a connection. Pick bank transfer to queue this order.")
      return
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
      if (paymentMethod === "flutterwave") {
        const { checkoutUrl } = await startCardCheckout(payload)
        // Cart is deliberately left alone until the payment confirms: if the
        // buyer abandons the card page, their basket is still here.
        window.location.href = checkoutUrl
        return
      }

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
          <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white">
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
            const primaryImage = product ? getPrimaryProductImage(product) : null
            return (
              <Card key={item.productId} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-canvas">
                    <RemoteImage
                      src={primaryImage}
                      alt={item.name}
                      sizes="64px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{item.name}</p>
                        <p className="mt-1 text-sm text-muted">
                          {money(item.price).text} each
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
                        {money(item.price * item.quantity).text}
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

            {profile && !profile.phone?.trim() ? (
              <div className="mt-4">
                <p className="text-sm font-semibold text-ink">Phone number</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  The seller uses this to confirm delivery on WhatsApp.
                </p>
                <input
                  className="mt-2 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand/40"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0803 000 0000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-ink">
                {PAYMENT_METHODS.length > 1
                  ? "Choose how you want to pay"
                  : "How you'll pay"}
              </p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => {
                  const methodMeta = PAYMENT_METHOD_META[method]
                  const needsSellerDetails =
                    method === "vendor_transfer" && !vendorTransferReady

                  return (
                    <button
                      key={method}
                      type="button"
                      className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                        paymentMethod === method
                          ? "border-brand/40 bg-brand/5"
                          : "border-border bg-surface"
                      }`}
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
                        {needsSellerDetails
                          ? "Place the order now. The seller can share payment details after confirming."
                          : methodMeta.helper}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* The account to pay into, at the moment the buyer decides to
                  pay. It was only ever shown after the order was placed. */}
              {paymentMethod === "vendor_transfer" && vendorTransferReady ? (
                <div className="rounded-[22px] border border-border bg-canvas p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Send payment to
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    {(
                      [
                        ["Bank", vendorData?.vendor.bankName],
                        ["Account name", vendorData?.vendor.accountName],
                        ["Account number", vendorData?.vendor.accountNumber]
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <dt className="text-muted">{label}</dt>
                        <dd
                          className={
                            label === "Account number"
                              ? "select-all font-mono text-base font-bold tracking-wide text-ink"
                              : "font-semibold text-ink"
                          }
                        >
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {vendorData?.vendor.paymentNote ? (
                    <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted">
                      {vendorData.vendor.paymentNote}
                    </p>
                  ) : null}

                  {/* baseText, not text: this is a naira account at a Nigerian
                      bank, so the figure to send is the naira one. Quoting the
                      shopper's display currency here would have them transfer
                      the wrong amount. */}
                  <p className="mt-3 text-xs leading-5 text-muted">
                    Transfer{" "}
                    <span className="font-semibold text-ink">
                      {money(subtotal).baseText}
                    </span>
                    , then place the order so the seller can match your payment.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted">Subtotal</p>
              <p className="text-lg font-bold text-brand">
                {money(subtotal).text}
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
              <Link
                href="/login?next=/"
                className="mt-3 flex w-full items-center justify-center rounded-full border border-border px-4 py-3 text-sm font-semibold text-ink transition hover:border-rose/50 hover:text-rose"
                onClick={() => setOpen(false)}
              >
                Sign in to place this order
              </Link>
            ) : null}
          </Card>
        </div>
      </BottomSheet>
    </>
  )
}

/** Accepts 0803..., 803..., 234... and +234... — returns "" when unusable. */
function normalizeNigerianPhone(rawPhone: string) {
  const compact = rawPhone.trim().replace(/[\s()-]/g, "")

  if (!compact || compact === "+234" || compact === "+") {
    return ""
  }

  const withCountryCode = compact.startsWith("+")
    ? compact
    : compact.startsWith("234")
      ? `+${compact}`
      : compact.startsWith("0")
        ? `+234${compact.slice(1)}`
        : `+234${compact}`

  return /^\+\d{7,15}$/.test(withCountryCode) ? withCountryCode : ""
}
