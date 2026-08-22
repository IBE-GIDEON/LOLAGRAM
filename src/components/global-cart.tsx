"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { FiShoppingBag, FiTrash2 } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"
import { RemoteImage } from "@/components/remote-image"
import { BottomSheet, Button, Card } from "@/components/ui"
import { useLocale } from "@/components/providers/locale-provider"
import { loadVendorDetail } from "@/lib/marketplace"
import { getPrimaryProductImage } from "@/lib/product-images"
import { type VendorDetail } from "@/lib/types"

export function GlobalCart() {
  const router = useRouter()
  const { profile } = useAuth()
  const {
    vendorId,
    items,
    removeItem,
    updateQuantity,
    itemCount,
    subtotal
  } = useCart()
  const { money } = useLocale()
  const [open, setOpen] = useState(false)
  const [vendorData, setVendorData] = useState<VendorDetail | null>(null)

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

  // Item prices are captured when the item is added to the cart. If the seller
  // edits one while it sits there, the stored figure goes stale. Card and
  // pay-on-delivery are re-priced server-side by priceCart, so those charge
  // correctly whatever we show — but a bank transfer is money the buyer sends
  // by hand against the figure on this screen, so it has to be the live one.
  const liveSubtotal = useMemo(() => {
    if (productMap.size === 0) return subtotal
    return items.reduce((total, item) => {
      const product = productMap.get(item.productId)
      return total + (product?.price ?? item.price) * item.quantity
    }, 0)
  }, [items, productMap, subtotal])

  const priceChanged =
    productMap.size > 0 && Math.abs(liveSubtotal - subtotal) > 0.005

  if (!vendorId || itemCount === 0) {
    return null
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
            {priceChanged ? (
              <p className="mb-4 rounded-2xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                A price in your cart changed since you added it. The total below
                is the current one.
              </p>
            ) : null}

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Subtotal</p>
              <p className="text-lg font-bold text-brand">
                {money(liveSubtotal).text}
              </p>
            </div>

            {/* Address, delivery and payment moved to /checkout, so this sheet
                stays what it is: the basket. */}
            <Button
              className="mt-4 w-full"
              onClick={() => {
                setOpen(false)
                router.push(profile ? "/checkout" : "/login?next=/checkout")
              }}
            >
              {profile ? "Checkout" : "Sign in to check out"}
            </Button>
            <p className="mt-3 text-xs leading-5 text-muted">
              You will confirm your address and how you want to pay on the next
              page.
            </p>
          </Card>
        </div>
      </BottomSheet>
    </>
  )
}
