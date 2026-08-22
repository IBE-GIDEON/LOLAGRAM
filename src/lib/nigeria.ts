/** The 36 states and the Federal Capital Territory, for the Region field. */
export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Federal Capital Territory",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara"
] as const

export type NigerianState = (typeof NIGERIAN_STATES)[number]

/** Accepts 0803..., 803..., 234... and +234... — returns "" when unusable. */
export function normalizeNigerianPhone(rawPhone: string) {
  const compact = rawPhone.trim().replace(/[\s()-]/g, "")

  if (!compact || compact === "+234" || compact === "+") {
    return ""
  }

  const withCountryCode = compact.startsWith("+")
    ? compact
    : compact.startsWith("234")
      ? `+${compact}`
      : compact.startsWith("0")
        ? `+234${compact.slice(1)}`
        : `+234${compact}`

  return /^\+\d{7,15}$/.test(withCountryCode) ? withCountryCode : ""
}

/** "+2349162217254" reads as "+234 916 221 7254" on the confirmation line. */
export function formatNigerianPhone(phone: string) {
  const normalized = normalizeNigerianPhone(phone)
  if (!normalized.startsWith("+234") || normalized.length !== 14) {
    return normalized || phone.trim()
  }

  const digits = normalized.slice(4)
  return `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}
