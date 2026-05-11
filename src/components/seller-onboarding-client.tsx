"use client"

import Link from "next/link"
import { useState } from "react"
import toast from "react-hot-toast"
import { FiTrash2 } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { Button, Card, Input, SectionHeading, Textarea } from "@/components/ui"
import { CATEGORY_OPTIONS } from "@/lib/constants"
import { uploadImage, uploadImages } from "@/lib/image"
import { saveProduct, saveSellerProfile } from "@/lib/marketplace"
import { type VendorCategory } from "@/lib/types"

const MAX_PRODUCT_IMAGES = 6

export function SellerOnboardingClient() {
  const { profile, vendorProfile, refreshProfile, upgradeAccountType } = useAuth()
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [uploadingProductImages, setUploadingProductImages] = useState(false)
  const [storeName, setStoreName] = useState(vendorProfile?.storeName ?? "")
  const [category, setCategory] = useState<VendorCategory>(
    vendorProfile?.category ?? "fashion"
  )
  const [storePhotoUrl, setStorePhotoUrl] = useState(vendorProfile?.storePhotoUrl ?? "")
  const [bio, setBio] = useState(vendorProfile?.bio ?? "")
  const [city, setCity] = useState(vendorProfile?.city ?? "")
  const [whatsappNumber, setWhatsappNumber] = useState(
    vendorProfile?.whatsappNumber ?? profile?.phone ?? "+234"
  )
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productPhotoUrls, setProductPhotoUrls] = useState<string[]>([])

  const handleProductImageUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return

    const remainingSlots = MAX_PRODUCT_IMAGES - productPhotoUrls.length
    if (remainingSlots <= 0) {
      toast.error(`You can upload up to ${MAX_PRODUCT_IMAGES} product photos.`)
      return
    }

    const selectedFiles = Array.from(fileList).slice(0, remainingSlots)
    setUploadingProductImages(true)

    try {
      const nextUrls = await uploadImages(selectedFiles, "product-photos")
      setProductPhotoUrls((current) => [...current, ...nextUrls])

      if (fileList.length > remainingSlots) {
        toast.error(`Only the first ${remainingSlots} photo(s) were added.`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload product photos.")
    } finally {
      setUploadingProductImages(false)
    }
  }

  if (!profile) {
    return (
      <div className="space-y-4 p-4 pb-safe-nav">
        <SectionHeading title="Seller onboarding" />
        <Card className="p-5">
          <p className="text-lg font-semibold text-ink">Sign in first</p>
          <p className="mt-2 text-sm text-muted">
            Your seller onboarding is tied to the same phone-auth account you use
            as a buyer.
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
      <SectionHeading title="Seller onboarding" />
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Step {step} of 4</p>
          <p className="text-sm text-muted">Under 5 minutes</p>
        </div>
        <div className="mt-4 h-2 rounded-full bg-canvas">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </Card>

      {step === 1 ? (
        <Card className="space-y-4 p-5">
          <Input
            placeholder="Store name"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
          />
          <select
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none"
            value={category}
            onChange={(event) => setCategory(event.target.value as VendorCategory)}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button className="w-full" onClick={() => setStep(2)}>
            Continue
          </Button>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-4 p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-canvas px-4 py-8 text-center">
            <input
              className="hidden"
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                try {
                  setStorePhotoUrl(await uploadImage(file, "store-photos"))
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Could not upload store photo."
                  )
                }
                event.target.value = ""
              }}
            />
            <p className="text-sm font-semibold text-ink">
              {storePhotoUrl ? "Store photo uploaded" : "Upload store photo"}
            </p>
            <p className="mt-1 text-xs text-muted">Camera or gallery</p>
          </label>
          <Textarea
            placeholder="Tell buyers what you sell"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
          />
          <Input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
          <Input
            placeholder="WhatsApp number"
            value={whatsappNumber}
            onChange={(event) => setWhatsappNumber(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Continue</Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="space-y-4 p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-canvas px-4 py-8 text-center">
            <input
              className="hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={async (event) => {
                await handleProductImageUpload(event.target.files)
                event.target.value = ""
              }}
            />
            <p className="text-sm font-semibold text-ink">
              {uploadingProductImages
                ? "Uploading product photos..."
                : productPhotoUrls.length > 0
                  ? `Add more photos (${productPhotoUrls.length}/${MAX_PRODUCT_IMAGES})`
                  : "Upload first product photos"}
            </p>
            <p className="mt-1 text-xs text-muted">
              Add up to {MAX_PRODUCT_IMAGES} images for your first listing.
            </p>
          </label>

          {productPhotoUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {productPhotoUrls.map((photoUrl, index) => (
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
                      setProductPhotoUrls((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
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
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
          />
          <Input
            placeholder="Price in Naira"
            value={productPrice}
            onChange={(event) => setProductPrice(event.target.value)}
          />
          <Textarea
            placeholder="Short product description"
            value={productDescription}
            onChange={(event) => setProductDescription(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (!storeName.trim()) {
                  toast.error("Add your store name first.")
                  return
                }

                if (!productName.trim()) {
                  toast.error("Add your first product name.")
                  return
                }

                if (!Number(productPrice)) {
                  toast.error("Enter a valid first product price.")
                  return
                }

                if (productPhotoUrls.length === 0) {
                  toast.error("Upload at least one product photo.")
                  return
                }

                setBusy(true)
                try {
                  const vendor = await saveSellerProfile(profile.id, {
                    storeName: storeName.trim(),
                    category,
                    storePhotoUrl,
                    bio: bio.trim(),
                    city: city.trim(),
                    whatsappNumber: whatsappNumber.trim()
                  })

                  await saveProduct({
                    vendorId: vendor.id,
                    name: productName.trim(),
                    description: productDescription.trim(),
                    price: Number(productPrice || 0),
                    photoUrl: productPhotoUrls[0],
                    photoUrls: productPhotoUrls,
                    inStock: true
                  })

                  if (profile.accountType === "buyer") {
                    await upgradeAccountType("both")
                  }

                  await refreshProfile(profile.id)
                  setStep(4)
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Could not launch store."
                  )
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? "Launching store..." : "Launch store"}
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="p-6 text-center">
          <p className="text-2xl font-bold text-ink">Your store is live on LOLAGRAM</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            You can now manage products, track store orders, and share your store
            link with buyers.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/seller/products"
              className="inline-flex items-center justify-center rounded-full bg-chrome px-4 py-3 text-sm font-semibold text-white"
            >
              Manage products
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink"
            >
              Back to profile
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
