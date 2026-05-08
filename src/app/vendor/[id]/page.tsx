import { VendorStoreClient } from "@/components/vendor-store-client"

export default function VendorPage({
  params
}: {
  params: { id: string }
}) {
  return <VendorStoreClient vendorId={params.id} />
}
