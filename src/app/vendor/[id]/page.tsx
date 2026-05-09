import { VendorStoreClient } from "@/components/vendor-store-client"

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
