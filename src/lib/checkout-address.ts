import { formatNigerianPhone, normalizeNigerianPhone } from "@/lib/nigeria"

/**
 * The delivery address as the buyer fills it in.
 *
 * The orders table keeps a single delivery_address text column, so this shape
 * lives on the buyer's own device and is folded down to one line when the
 * order is placed. Keeping the parts apart is what lets the checkout page
 * reopen the form with everything still in its own field.
 */
export interface CheckoutAddress {
  firstName: string
  lastName: string
  region: string
  city: string
  phone: string
  additionalPhone: string
  address: string
  landmark: string
}

export const EMPTY_CHECKOUT_ADDRESS: CheckoutAddress = {
  firstName: "",
  lastName: "",
  region: "",
  city: "",
  phone: "",
  additionalPhone: "",
  address: "",
  landmark: ""
}

const STORAGE_KEY = "afunwa-checkout-address-v1"

export function loadSavedAddress(): CheckoutAddress | null {
  if (typeof window === "undefined") return null

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<CheckoutAddress>
    const address = { ...EMPTY_CHECKOUT_ADDRESS, ...parsed }
    // A half-written record from an older version should not present itself as
    // a finished address and skip the buyer past the form.
    return validateAddress(address) === null ? address : null
  } catch {
    return null
  }
}

export function persistAddress(address: CheckoutAddress) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(address))
}

/** The first thing wrong with the address, or null when it is usable. */
export function validateAddress(address: CheckoutAddress): string | null {
  if (!address.firstName.trim()) return "Add your first name."
  if (!address.lastName.trim()) return "Add your last name."
  if (!address.region.trim()) return "Choose your region."
  if (!address.city.trim()) return "Add your city or area."
  if (!address.address.trim()) return "Add the delivery address."
  if (!normalizeNigerianPhone(address.phone)) {
    return "Add a valid phone number, like 0803 000 0000."
  }
  if (address.additionalPhone.trim() && !normalizeNigerianPhone(address.additionalPhone)) {
    return "Check the additional phone number, or clear it."
  }
  return null
}

export function getFullName(address: CheckoutAddress) {
  return `${address.firstName.trim()} ${address.lastName.trim()}`.trim()
}

/** The two lines under the collapsed step, as on the confirmation card. */
export function addressSummary(address: CheckoutAddress) {
  const place = [address.address.trim(), address.landmark.trim()]
    .filter(Boolean)
    .join(", ")

  const region = [address.region.trim(), address.city.trim()]
    .filter(Boolean)
    .join(" - ")

  return {
    name: getFullName(address),
    detail: [place, region, formatNigerianPhone(address.phone)]
      .filter(Boolean)
      .join(" | ")
  }
}

/**
 * Everything the seller needs to deliver, on one line.
 *
 * One line rather than several because the same string is shown read-only on
 * the order page and loaded into a textarea when the buyer edits it, and a
 * read-only paragraph would collapse the newlines anyway.
 */
export function composeDeliveryAddress(address: CheckoutAddress) {
  const parts = [
    getFullName(address),
    address.address.trim(),
    address.landmark.trim() ? `near ${address.landmark.trim()}` : "",
    address.city.trim(),
    address.region.trim()
  ].filter(Boolean)

  const phones = [address.phone, address.additionalPhone]
    .map((value) => formatNigerianPhone(value))
    .filter(Boolean)

  const contact = phones.length > 1 ? `${phones[0]} or ${phones[1]}` : phones[0] ?? ""

  return contact ? `${parts.join(", ")} — ${contact}` : parts.join(", ")
}
