"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Button, Card, SectionHeading } from "@/components/ui"
import { ORDER_STATUS_META } from "@/lib/constants"
import { formatCurrency } from "@/lib/format"
import { loadOrderDetail } from "@/lib/marketplace"
import { type OrderDetail } from "@/lib/types"

export default function OrderConfirmationPage({
  params
}: {
  params: { id: string }
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null)

  useEffect(() => {
    loadOrderDetail(params.id).then(setOrder)
  }, [params.id])

  return (
    <div className="space-y-4 p-4">
      <SectionHeading title="Order confirmation" />
      <Card className="p-6 text-center">
        <p className="text-2xl font-bold text-ink">Your order is in</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          LOLAGRAM has your order and your seller will receive a notification right
          away.
        </p>
        {order ? (
          <div className="mt-5 space-y-3 rounded-[24px] bg-canvas p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Order ID</span>
              <span className="font-semibold text-ink">{order.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Status</span>
              <span className="font-semibold text-brand">
                {ORDER_STATUS_META[order.status].label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Total</span>
              <span className="font-semibold text-ink">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-full bg-chrome px-4 py-3 text-sm font-semibold text-white"
          >
            View orders
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink"
          >
            Back home
          </Link>
        </div>
      </Card>
    </div>
  )
}
