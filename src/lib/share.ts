/**
 * Product deep links. A product lives at its vendor's store with ?product=<id>,
 * which opens the store with that product's detail already showing.
 */
export function buildProductUrl(
  vendorId: string,
  productId: string,
  origin?: string
) {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "")

  return `${base}/vendor/${vendorId}?product=${encodeURIComponent(productId)}`
}

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed"

/**
 * Native share sheet where it exists (phones — WhatsApp, Instagram, SMS),
 * clipboard everywhere else. Falls back to execCommand for the in-app browsers
 * that block the async clipboard API.
 */
export async function shareLink(data: {
  title: string
  text: string
  url: string
}): Promise<ShareOutcome> {
  if (typeof navigator === "undefined") return "failed"

  if (typeof navigator.share === "function") {
    try {
      await navigator.share(data)
      return "shared"
    } catch (error) {
      // User dismissed the sheet — not an error worth reporting.
      if (error instanceof Error && error.name === "AbortError") {
        return "cancelled"
      }
      // Anything else: fall through and try to copy instead.
    }
  }

  try {
    await navigator.clipboard.writeText(data.url)
    return "copied"
  } catch {
    return copyWithFallback(data.url) ? "copied" : "failed"
  }
}

/** Last resort for insecure contexts and locked-down in-app browsers. */
function copyWithFallback(text: string) {
  if (typeof document === "undefined") return false

  try {
    const field = document.createElement("textarea")
    field.value = text
    field.setAttribute("readonly", "")
    field.style.position = "fixed"
    field.style.opacity = "0"
    document.body.appendChild(field)
    field.select()
    const copied = document.execCommand("copy")
    document.body.removeChild(field)
    return copied
  } catch {
    return false
  }
}
