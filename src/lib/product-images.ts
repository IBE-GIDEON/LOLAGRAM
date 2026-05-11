import { type Product } from "@/lib/types"

export function normalizeProductPhotoUrls(
  photoUrls?: string[] | null,
  photoUrl?: string | null
) {
  const urls = Array.isArray(photoUrls)
    ? photoUrls.filter((value): value is string => Boolean(value?.trim()))
    : []

  if (urls.length > 0) {
    return urls
  }

  if (typeof photoUrl === "string" && photoUrl.trim()) {
    const trimmed = photoUrl.trim()

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (value): value is string =>
              typeof value === "string" && Boolean(value.trim())
          )
        }
      } catch {
        return [trimmed]
      }
    }

    return [trimmed]
  }

  return []
}

export function serializeLegacyPhotoUrl(photoUrls?: string[] | null) {
  const urls = normalizeProductPhotoUrls(photoUrls)

  if (urls.length === 0) {
    return null
  }

  if (urls.length === 1) {
    return urls[0]
  }

  return JSON.stringify(urls)
}

export function getPrimaryProductImage(product: Pick<Product, "photoUrl" | "photoUrls">) {
  return product.photoUrls[0] ?? product.photoUrl
}
