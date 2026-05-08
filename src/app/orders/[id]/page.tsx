import { OrderDetailClient } from "@/components/order-detail-client"

export default function OrderDetailPage({
  params
}: {
  params: { id: string }
}) {
  return <OrderDetailClient orderId={params.id} />
}
