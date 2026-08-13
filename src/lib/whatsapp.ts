/**
 * wa.me links.
 *
 * The number is typed by a seller into a free text field, so it arrives as
 * "+234 803 123 4567", "0803-123-4567" or anything in between. wa.me accepts
 * digits only, in full international form: a "+" or a space in the path gives
 * you WhatsApp's "phone number shared via url is invalid" page, which is
 * exactly what the storefront link used to do.
 */
export function toWhatsAppDigits(raw: string | null | undefined) {
  const compact = String(raw ?? "").replace(/[^\d+]/g, "")

  if (!compact || compact === "+" || compact === "+234") {
    return ""
  }

  let international = compact.startsWith("+")
    ? compact.slice(1)
    : compact.startsWith("234")
      ? compact
      : compact.startsWith("0")
        ? `234${compact.slice(1)}` // local Nigerian form
        : `234${compact}`

  // "+234 (0) 803 …" is a common way to write it, but the trunk 0 is dropped
  // once the country code is there — left in, it dials nothing.
  if (international.startsWith("2340")) {
    international = `234${international.slice(4)}`
  }

  // 10 digits covers the shortest full international number here, 15 is the
  // E.164 ceiling.
  return /^\d{10,15}$/.test(international) ? international : ""
}

export function buildWhatsAppUrl(
  raw: string | null | undefined,
  message?: string
) {
  const digits = toWhatsAppDigits(raw)
  if (!digits) return null

  const query = message ? `?text=${encodeURIComponent(message)}` : ""
  return `https://wa.me/${digits}${query}`
}
