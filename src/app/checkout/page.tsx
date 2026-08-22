import { type Metadata } from "next"

import { CheckoutPageClient } from "@/components/checkout-page-client"
import { hasGooglePlaces } from "@/lib/env"

export const metadata: Metadata = {
  title: "Checkout"
}

export default function CheckoutPage() {
  // Read on the server: whether the lookup is configured depends on a
  // server-only key, and the browser has no way to see it for itself.
  return <CheckoutPageClient placesEnabled={hasGooglePlaces} />
}
