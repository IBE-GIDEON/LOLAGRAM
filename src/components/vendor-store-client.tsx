"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import toast from "react-hot-toast"
import { FiMessageCircle, FiStar } from "react-icons/fi"

import { useCart } from "@/components/providers/cart-provider"
import { BottomSheet, Button, Card, SectionHeading, StarRating } from "@/components/ui"
import {
  formatCategory,
  formatCompactNumber,
  formatCurrency,
  formatDate
} from "@/lib/format"
import { RemoteImage } from "@/components/remote-image"
import { getPrimaryProductImage } from "@/lib/product-images"
import { loadVendorDetail, peekCachedVendorDetail } from "@/lib/marketplace"
import { type Product, type VendorDetail } from "@/lib/types"

export function VendorStoreClient({
  vendorId,
  initialProductId
}: {
  vendorId: string
  initialProductId?: string
}) {
  const { addItem } = useCart()
  const [data, setData] = useState<VendorDetail | null>(() =>
    peekCachedVendorDetail(vendorId)
  )
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
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

  const reviewPreview = useMemo(
    () => (Array.isArray(data?.reviews) ? data.reviews.slice(0, 5) : []),
    [data?.reviews]
  )
  const selectedProductImages = useMemo(
    () => selectedProduct?.photoUrls ?? [],
    [selectedProduct]
  )

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [selectedProduct?.id])

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
            {data.products.map((product) => {
              const primaryImage = getPrimaryProductImage(product)
              return (
              <button
                key={product.id}
                className="overflow-hidden rounded-[22px] bg-surface text-left shadow-soft transition active:scale-[0.99]"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative aspect-square overflow-hidden bg-canvas">
                  <RemoteImage
                    src={primaryImage}
                    alt={product.name}
                    sizes="(max-width: 430px) 50vw, 215px"
                  />
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
                  {product.photoUrls.length > 1 ? (
                    <p className="text-[11px] font-medium text-muted">
                      {product.photoUrls.length} photos
                    </p>
                  ) : null}
                </div>
              </button>
              )
            })}
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

      <BottomSheet
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name}
      >
        {selectedProduct ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[24px] bg-canvas">
              {selectedProductImages[selectedImageIndex] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedProductImages[selectedImageIndex]}
                  alt={selectedProduct.name}
                  className="aspect-square w-full object-cover"
                />
              ) : null}
            </div>
            {selectedProductImages.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedProductImages.map((image, index) => (
                  <button
                    key={`${selectedProduct.id}-${index}`}
                    type="button"
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border ${
                      selectedImageIndex === index
                        ? "border-brand"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`${selectedProduct.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
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
    </div>
  )
}
