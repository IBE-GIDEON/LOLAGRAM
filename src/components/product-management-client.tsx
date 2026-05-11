"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { FiTrash2 } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { BottomSheet, Button, Card, Input, SectionHeading, Textarea } from "@/components/ui"
import { formatCurrency } from "@/lib/format"
import { uploadImages } from "@/lib/image"
import { deleteProduct, loadSellerProducts, saveProduct } from "@/lib/marketplace"
import { getPrimaryProductImage } from "@/lib/product-images"
import { type Product } from "@/lib/types"

const MAX_PRODUCT_IMAGES = 6

const emptyForm = {
  name: "",
  price: "",
  description: "",
  photoUrls: [] as string[],
  inStock: true
}

export function ProductManagementClient() {
  const { profile, vendorProfile } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [uploadingImages, setUploadingImages] = useState(false)

  async function refreshProducts() {
    if (!profile) return
    const nextProducts = await loadSellerProducts(profile.id)
    setProducts(nextProducts)
  }

  useEffect(() => {
    refreshProducts()
  }, [profile?.id])

  const title = useMemo(
    () => (editingProduct ? "Edit product" : "Add new product"),
    [editingProduct]
  )

  const openProductEditor = (product?: Product | null) => {
    setEditingProduct(product ?? null)
    setForm(
      product
        ? {
            name: product.name,
            price: String(product.price),
            description: product.description,
            photoUrls:
              product.photoUrls.length > 0
                ? product.photoUrls
                : product.photoUrl
                  ? [product.photoUrl]
                  : [],
            inStock: product.inStock
          }
        : emptyForm
    )
    setOpen(true)
  }

  const handleImageUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return

    const remainingSlots = MAX_PRODUCT_IMAGES - form.photoUrls.length
    if (remainingSlots <= 0) {
      toast.error(`You can upload up to ${MAX_PRODUCT_IMAGES} photos per product.`)
      return
    }

    const selectedFiles = Array.from(fileList).slice(0, remainingSlots)
    setUploadingImages(true)

    try {
      const nextUrls = await uploadImages(selectedFiles, "product-photos")
      setForm((current) => ({
        ...current,
        photoUrls: [...current.photoUrls, ...nextUrls]
      }))

      if (fileList.length > remainingSlots) {
        toast.error(`Only the first ${remainingSlots} photo(s) were added.`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed.")
    } finally {
      setUploadingImages(false)
    }
  }

  if (!profile || !vendorProfile) {
    return (
      <div className="space-y-4 p-4 pb-safe-nav">
        <SectionHeading title="Manage products" />
        <Card className="p-5">
          <p className="text-lg font-semibold text-ink">Create your store first</p>
          <p className="mt-2 text-sm text-muted">
            Finish the seller onboarding flow to start adding products.
          </p>
          <a
            href="/onboarding/seller"
            className="mt-4 inline-flex rounded-full bg-chrome px-4 py-3 text-sm font-semibold text-white"
          >
            Open onboarding
          </a>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <SectionHeading
        title="Manage products"
        action={
          <Button
            className="px-4 py-2 text-xs"
            onClick={() => openProductEditor()}
          >
            Add New Product
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <button
            key={product.id}
            className="overflow-hidden rounded-[22px] bg-surface text-left shadow-soft"
            onClick={() => openProductEditor(product)}
          >
            <div className="relative aspect-square bg-canvas">
              {getPrimaryProductImage(product) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getPrimaryProductImage(product)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
              {product.photoUrls.length > 1 ? (
                <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {product.photoUrls.length} photos
                </span>
              ) : null}
            </div>
            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-sm font-semibold text-ink">
                {product.name}
              </p>
              <p className="font-bold text-brand">{formatCurrency(product.price)}</p>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${
                  product.inStock
                    ? "bg-emerald-100 text-success"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {product.inStock ? "In stock" : "Out of stock"}
              </span>
            </div>
          </button>
        ))}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={title}>
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-canvas px-4 py-8 text-center">
            <input
              className="hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={async (event) => {
                await handleImageUpload(event.target.files)
                event.target.value = ""
              }}
            />
            <p className="text-sm font-semibold text-ink">
              {uploadingImages
                ? "Uploading product photos..."
                : form.photoUrls.length > 0
                  ? `Add more photos (${form.photoUrls.length}/${MAX_PRODUCT_IMAGES})`
                  : "Upload product photos"}
            </p>
            <p className="mt-1 text-xs text-muted">
              Add up to {MAX_PRODUCT_IMAGES} images. The first one becomes the cover.
            </p>
          </label>

          {form.photoUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {form.photoUrls.map((photoUrl, index) => (
                <div
                  key={`${photoUrl}-${index}`}
                  className="relative overflow-hidden rounded-[20px] bg-canvas"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt={`Product photo ${index + 1}`}
                    className="aspect-square h-full w-full object-cover"
                  />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-1 text-[10px] font-semibold text-white">
                      Cover
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        photoUrls: current.photoUrls.filter((_, itemIndex) => itemIndex !== index)
                      }))
                    }
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <Input
            placeholder="Product name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <Input
            placeholder="Price in Naira"
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({ ...current, price: event.target.value }))
            }
          />
          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value
              }))
            }
          />
          <label className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
            <span className="text-sm font-medium text-ink">In stock</span>
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(event) =>
                setForm((current) => ({ ...current, inStock: event.target.checked }))
              }
            />
          </label>
          <Button
            className="w-full"
            onClick={async () => {
              if (!form.name.trim()) {
                toast.error("Add a product name first.")
                return
              }

              if (!Number(form.price)) {
                toast.error("Enter a valid product price.")
                return
              }

              if (form.photoUrls.length === 0) {
                toast.error("Upload at least one product photo.")
                return
              }

              try {
                await saveProduct({
                  id: editingProduct?.id,
                  vendorId: vendorProfile.id,
                  name: form.name.trim(),
                  description: form.description.trim(),
                  price: Number(form.price || 0),
                  photoUrl: form.photoUrls[0],
                  photoUrls: form.photoUrls,
                  inStock: form.inStock
                })
                toast.success(editingProduct ? "Product updated." : "Product added.")
                setOpen(false)
                setEditingProduct(null)
                setForm(emptyForm)
                refreshProducts()
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not save product.")
              }
            }}
          >
            {editingProduct ? "Save changes" : "Add product"}
          </Button>
          {editingProduct ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  await deleteProduct(editingProduct.id)
                  toast.success("Product deleted.")
                  setOpen(false)
                  setEditingProduct(null)
                  setForm(emptyForm)
                  refreshProducts()
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Could not delete product."
                  )
                }
              }}
            >
              Delete product
            </Button>
          ) : null}
        </div>
      </BottomSheet>
    </div>
  )
}
