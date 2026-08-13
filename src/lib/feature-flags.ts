import { env } from "@/lib/env"

/**
 * Launch flags for the single-store phase.
 *
 * The multi-vendor marketplace is fully built and stays in the codebase — these
 * flags only hide it. While we are the only store selling, a "Find Vendors" tab
 * and a public "Start selling" button promise a marketplace that is not there
 * yet, so both are closed until buyers tell us otherwise. Nothing here needs a
 * code change to reverse: set the env vars and redeploy.
 */

/** Vendor browsing: the Find Vendors tab, the Stores search filter, store lists. */
export const VENDOR_DISCOVERY_ENABLED = env.enableVendorDiscovery

/** Whether any signed-in buyer can open their own store. */
export const SELLER_SIGNUP_OPEN = env.enableSellerSignup

/**
 * Offer "Pay on Delivery" at checkout.
 *
 * Off for now, leaving direct payment to the seller as the only route. The
 * option is hidden, not removed: existing orders keep their pay_on_delivery
 * status and the order route still accepts it, so nothing already placed
 * breaks and turning it back on needs no code change.
 */
export const PAY_ON_DELIVERY_ENABLED = env.enablePayOnDelivery

/**
 * Our own accounts, which keep seller access while signup is closed. Comma
 * separated in NEXT_PUBLIC_SELLER_EMAILS.
 *
 * This is a UI lock, not a security boundary: the list is compiled into the
 * client bundle and is readable by anyone. Supabase row level security on
 * vendor_profiles is what actually stops a stranger from creating a store.
 */
const SELLER_EMAILS = new Set(
  env.sellerEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
)

/**
 * Can this account reach seller onboarding, product management and seller view?
 *
 * An account that already owns a store always keeps access, so closing signup
 * can never lock an existing vendor out of the products they already listed.
 */
export function canOpenStore({
  email,
  hasStore = false
}: {
  email?: string | null
  hasStore?: boolean
}) {
  if (SELLER_SIGNUP_OPEN || hasStore) {
    return true
  }

  const normalized = email?.trim().toLowerCase()
  if (!normalized) {
    return false
  }

  return SELLER_EMAILS.has(normalized)
}
