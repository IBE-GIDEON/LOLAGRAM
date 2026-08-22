import { type Metadata } from "next"

import { CheckoutPageClient } from "@/components/checkout-page-client"

export const metadata: Metadata = {
  title: "Checkout"
}

export default function CheckoutPage() {
  return <CheckoutPageClient />
}
