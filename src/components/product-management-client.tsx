"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"

import { useAuth } from "@/components/providers/auth-provider"
import { BottomSheet, Button, Card, Input, SectionHeading, Textarea } from "@/components/ui"
import { uploadImage } from "@/lib/image"
import { deleteProduct, loadSellerProducts, saveProduct } from "@/lib/marketplace"
import { formatCurrency } from "@/lib/format"
import { type Product } from "@/lib/types"

const emptyForm = {
  name: "",
  price: "",
  description: "",
  photoUrl: "",
  inStock: true
}

export function ProductManagementClient() {
  const { profile, vendorProfile } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)

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

  if (!profile || !vendorProfile) {
    return (
      <div className="space-y-4 p-4">
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
    <div className="space-y-4 p-4">
      <SectionHeading
        title="Manage products"
        action={
          <Button
            className="px-4 py-2 text-xs"
            onClick={() => {
              setEditingProduct(null)
              setForm(emptyForm)
              setOpen(true)
            }}
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
            onClick={() => {
              setEditingProduct(product)
              setForm({
                name: product.name,
                price: String(product.price),
                description: product.description,
                photoUrl: product.photoUrl ?? "",
                inStock: product.inStock
              })
              setOpen(true)
            }}
          >
            <div className="aspect-square bg-canvas">
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
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const photoUrl = await uploadImage(file, "product-photos")
                setForm((current) => ({
                  ...current,
                  photoUrl
                }))
              }}
            />
            <p className="text-sm font-semibold text-ink">
              {form.photoUrl ? "Product photo ready" : "Upload product photo"}
            </p>
          </label>
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
              await saveProduct({
                id: editingProduct?.id,
                vendorId: vendorProfile.id,
                name: form.name,
                description: form.description,
                price: Number(form.price || 0),
                photoUrl: form.photoUrl,
                inStock: form.inStock
              })
              toast.success(editingProduct ? "Product updated." : "Product added.")
              setOpen(false)
              setEditingProduct(null)
              setForm(emptyForm)
              refreshProducts()
            }}
          >
            {editingProduct ? "Save changes" : "Add product"}
          </Button>
          {editingProduct ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await deleteProduct(editingProduct.id)
                toast.success("Product deleted.")
                setOpen(false)
                setEditingProduct(null)
                setForm(emptyForm)
                refreshProducts()
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
