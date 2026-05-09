"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import toast from "react-hot-toast"
import { FiMessageCircle, FiShoppingBag, FiStar } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"
import { BottomSheet, Button, Card, SectionHeading, StarRating } from "@/components/ui"
import {
  formatCategory,
  formatCompactNumber,
  formatCurrency,
  formatDate
} from "@/lib/format"
import { loadVendorDetail, startCheckout } from "@/lib/marketplace"
import { queueOfflineOrder } from "@/lib/offline-orders"
import { type Product, type VendorDetail } from "@/lib/types"

export function VendorStoreClient({
  vendorId,
  initialProductId
}: {
  vendorId: string
  initialProductId?: string
}) {
  const { profile } = useAuth()
  const {
    vendorId: cartVendorId,
    items,
    addItem,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal
  } = useCart()
  const [data, setData] = useState<VendorDetail | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const productRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadVendorDetail(vendorId).then(setData)
  }, [vendorId])

  useEffect(() => {
    if (!data || !initialProductId) return

    const matchingProduct = data.products.find(
      (product) => product.id === initialProductId
    )

    if (matchingProduct) {
      setSelectedProduct(matchingProduct)
    }
  }, [data, initialProductId])

  const cartItems = cartVendorId === vendorId ? items : []

  const handleCheckout = async () => {
    if (!profile || !data) {
      toast.error("Sign in from Profile before placing an order.")
      return
    }

    if (!deliveryAddress.trim()) {
      toast.error("Add a delivery address to continue.")
      return
    }

    const payload = {
      buyerId: profile.id,
      vendorId: data.vendor.id,
      items: cartItems,
      totalAmount: subtotal,
      deliveryAddress
    }

    if (!navigator.onLine) {
      await queueOfflineOrder(payload)
      clearCart()
      setCartOpen(false)
      toast.success("Order queued. We'll sync it once you're back online.")
      return
    }

    setSubmitting(true)
    try {
      const response = await startCheckout(payload)
      clearCart()
      window.location.assign(response.checkoutUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed.")
    } finally {
      setSubmitting(false)
    }
  }

  const reviewPreview = useMemo(
    () => data?.reviews.slice(0, 5) ?? [],
    [data?.reviews]
  )

  if (!data) {
    return <div className="p-4 text-sm text-muted">Loading store...</div>
  }

  return (
    <div className="pb-safe-nav">
      <div className="relative">
        <div className="h-44 overflow-hidden bg-gradient-to-br from-chrome via-chrome to-brand/70">
          {data.vendor.storePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.vendor.storePhotoUrl}
              alt={data.vendor.storeName}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="relative z-10 -mt-12 px-4">
          <Card className="overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-surface bg-brand/10">
                  {data.vendor.storePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.vendor.storePhotoUrl}
                      alt={data.vendor.storeName}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 pt-2">
                  <p className="text-xl font-bold text-ink">
                    {data.vendor.storeName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                    <span className="rounded-full bg-canvas px-2.5 py-1">
                      {formatCategory(data.vendor.category)}
                    </span>
                    <span>{data.vendor.city}</span>
                    <StarRating
                      rating={data.averageRating}
                      reviewCount={data.reviewCount}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {data.vendor.bio}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">
                      {formatCompactNumber(data.vendor.totalSales)} sales
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button
                  onClick={() =>
                    productRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Order
                </Button>
                <a
                  href={`https://wa.me/${data.vendor.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-whatsapp/25 bg-surface px-4 py-3 text-sm font-semibold text-whatsapp transition hover:bg-whatsapp/5"
                >
                  <FiMessageCircle />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6">
        <div ref={productRef}>
          <SectionHeading title="Products" />
          <div className="grid grid-cols-2 gap-3">
            {data.products.map((product) => (
              <button
                key={product.id}
                className="overflow-hidden rounded-[22px] bg-surface text-left shadow-soft transition active:scale-[0.99]"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="aspect-square overflow-hidden bg-canvas">
                  {product.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.photoUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="space-y-2 p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-ink">
                    {product.name}
                  </p>
                  <p className="text-base font-bold text-brand">
                    {formatCurrency(product.price)}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${
                      product.inStock
                        ? "bg-emerald-100 text-success"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionHeading title="Reviews" />
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Average rating</p>
                <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-ink">
                  {data.averageRating.toFixed(1)}
                  <FiStar className="fill-brand text-brand" />
                </div>
              </div>
              <StarRating
                rating={data.averageRating}
                reviewCount={data.reviewCount}
              />
            </div>
            <div className="mt-5 space-y-4">
              {reviewPreview.map((review) => (
                <div
                  key={review.id}
                  className="border-t border-border pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{review.buyerName}</p>
                    <div className="flex items-center gap-1 text-brand">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <FiStar key={index} className="fill-brand text-[13px]" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {review.comment}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {cartItems.length > 0 ? (
        <button
          className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-chrome px-5 py-3 text-sm font-semibold text-brand shadow-lg"
          onClick={() => setCartOpen(true)}
        >
          <FiShoppingBag />
          Cart ({itemCount})
        </button>
      ) : null}

      <BottomSheet
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name}
      >
        {selectedProduct ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[24px] bg-canvas">
              {selectedProduct.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedProduct.photoUrl}
                  alt={selectedProduct.name}
                  className="aspect-square w-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <p className="text-xl font-bold text-ink">{selectedProduct.name}</p>
              <p className="mt-2 text-lg font-bold text-brand">
                {formatCurrency(selectedProduct.price)}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                {selectedProduct.description}
              </p>
            </div>
            <Button
              className="w-full"
              disabled={!selectedProduct.inStock}
              onClick={() => {
                addItem(data.vendor.id, selectedProduct)
                setSelectedProduct(null)
                toast.success("Added to cart.")
              }}
            >
              {selectedProduct.inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet open={cartOpen} onClose={() => setCartOpen(false)} title="Cart">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <Card key={item.productId} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatCurrency(item.price)} each
                  </p>
                </div>
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
              </div>
            </Card>
          ))}

          <Card className="p-4">
            <p className="text-sm font-semibold text-ink">Delivery address</p>
            <textarea
              className="mt-3 min-h-[96px] w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand/40"
              placeholder="Enter your delivery address"
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
            />
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
              {submitting ? "Starting checkout..." : "Pay with Paystack"}
            </Button>
            {!profile ? (
              <p className="mt-3 text-xs text-muted">
                Sign in from{" "}
                <Link href="/profile" className="font-semibold text-brand">
                  Profile
                </Link>{" "}
                before checkout.
              </p>
            ) : null}
          </Card>
        </div>
      </BottomSheet>
    </div>
  )
}
