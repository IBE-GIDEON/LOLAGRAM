import type { Metadata } from "next"

import { VendorStoreClient } from "@/components/vendor-store-client"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// ---------------------------------------------------------------------------
// Dynamic metadata — gives every vendor store its own OG card when shared
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params
}: {
  params: { id: string }
}): Promise<Metadata> {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return { title: "Store — LOLAGRAM" }
  }

  const { data: vendor } = await supabase
    .from("vendor_profiles")
    .select("store_name, bio, store_photo_url, city, category")
    .eq("id", params.id)
    .maybeSingle()

  if (!vendor) {
    return { title: "Store — LOLAGRAM" }
  }

  const title = `${vendor.store_name} — LOLAGRAM`
  const description =
    vendor.bio?.trim() ||
    `Shop ${vendor.store_name} on LOLAGRAM${vendor.city ? ` · ${vendor.city}` : ""}.`

  const ogImage = vendor.store_photo_url
    ? [{ url: vendor.store_photo_url, width: 800, height: 800, alt: vendor.store_name }]
    : [{ url: "/pwa/icon-512.png", width: 512, height: 512, alt: "LOLAGRAM" }]

  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "LOLAGRAM",
      title,
      description,
      images: ogImage
    },
    twitter: {
      card: vendor.store_photo_url ? "summary_large_image" : "summary",
      title,
      description,
      images: vendor.store_photo_url
        ? [vendor.store_photo_url]
        : ["/pwa/icon-512.png"]
    }
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function VendorPage({
  params,
  searchParams
}: {
  params: { id: string }
  searchParams?: { product?: string }
}) {
  return (
    <VendorStoreClient
      vendorId={params.id}
      initialProductId={searchParams?.product}
    />
  )
}
