/**
 * Company details shown in the footer.
 *
 * Kept in one place because these are marketing claims about a real business:
 * when a number changes, it changes here and nowhere else.
 */

export const COMPANY_NAME = "Afunwa Hairline Inc"

/**
 * The trust strip.
 *
 * These are stated as fact to every visitor, so they need to be defensible —
 * Nigeria's FCCPA (and the equivalent elsewhere) treats a false or misleading
 * representation about a business as an offence, not a matter of taste.
 */
export const COMPANY_STATS: Array<{ value: string; label: string }> = [
  { value: "₦1B+", label: "in annual sales" },
  { value: "50M+", label: "units supplied" },
  { value: "700+", label: "stylist partners" },
  { value: "No.1", label: "factory-direct prices" }
]

/**
 * Social profiles.
 *
 * >>> REPLACE THESE HANDLES WITH YOUR REAL ONES. <<<
 * Any entry left blank is not rendered at all, so an unfinished link never
 * ships as a dead icon that lands a customer on "page not found".
 */
export const SOCIAL_LINKS: Array<{
  id: "facebook" | "instagram" | "tiktok" | "x"
  label: string
  href: string
}> = [
  { id: "facebook", label: "Facebook", href: "https://facebook.com/afunwahairline" },
  { id: "instagram", label: "Instagram", href: "https://instagram.com/afunwahairline" },
  { id: "tiktok", label: "TikTok", href: "https://tiktok.com/@afunwahairline" },
  { id: "x", label: "X", href: "https://x.com/afunwahairline" }
]

/** Only routes that exist — a footer full of 404s costs more trust than it buys. */
export const FOOTER_LINKS: Array<{ label: string; href: string }> = [
  { label: "Shop all", href: "/search" },
  { label: "Wigs", href: "/search?q=wig" },
  { label: "Closures", href: "/search?q=closure" },
  { label: "Bundles", href: "/search?q=bundle" },
  { label: "My orders", href: "/orders" },
  { label: "Account", href: "/profile" }
]
