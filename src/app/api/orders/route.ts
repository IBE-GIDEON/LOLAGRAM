import { NextResponse } from "next/server"

import { hasSupabaseAdmin } from "@/lib/env"
import { sendPushNotification } from "@/lib/push"
import { verifyAuthToken } from "@/lib/supabase/auth-guard"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type CheckoutPayload } from "@/lib/types"

export async function POST(request: Request) {
  // Require a valid Supabase session
  const user = await verifyAuthToken(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json()) as CheckoutPayload

  // Prevent a user from placing orders on behalf of someone else
  if (payload.buyerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = getSupabaseAdminClient()

  if (!hasSupabaseAdmin || !supabase) {
    return NextResponse.json(
      { error: "Supabase admin configuration is missing for order creation." },
      { status: 503 }
    )
  }

  const deliveryAddress = String(payload.deliveryAddress ?? "").trim()
  if (!deliveryAddress) {
    return NextResponse.json(
      { error: "A delivery address is required." },
      { status: 400 }
    )
  }

  const paymentMethod =
    payload.paymentMethod === "vendor_transfer"
      ? "vendor_transfer"
      : "pay_on_delivery"

  // Collapse the cart to id -> quantity. Anything the request says about price
  // is discarded: the browser is not allowed to decide what an order is worth.
  const requested = new Map<string, number>()
  for (const item of Array.isArray(payload.items) ? payload.items : []) {
    const productId = String(item?.productId ?? "").trim()
    const quantity = Math.floor(Number(item?.quantity ?? 0))

    if (!productId || !Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json(
        { error: "That cart is not valid. Refresh and try again." },
        { status: 400 }
      )
    }

    requested.set(productId, (requested.get(productId) ?? 0) + quantity)
  }

  if (requested.size === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 })
  }

  // Prices, names and the vendor all come from the database.
  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("id, name, price, in_stock, vendor_id, vendor_profiles!inner(is_active)")
    .eq("vendor_profiles.is_active", true)
    .in("id", [...requested.keys()])

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  if (!productRows || productRows.length !== requested.size) {
    return NextResponse.json(
      { error: "Something in your cart is no longer available. Refresh and try again." },
      { status: 409 }
    )
  }

  const outOfStock = productRows.find((row) => !row.in_stock)
  if (outOfStock) {
    return NextResponse.json(
      { error: `${String(outOfStock.name)} just went out of stock.` },
      { status: 409 }
    )
  }

  // One cart, one store — the cart already enforces this client-side.
  const vendorIds = new Set(productRows.map((row) => String(row.vendor_id)))
  if (vendorIds.size !== 1) {
    return NextResponse.json(
      { error: "An order can only contain items from one store." },
      { status: 400 }
    )
  }
  const vendorId = [...vendorIds][0]

  const items = productRows.map((row) => ({
    productId: String(row.id),
    name: String(row.name),
    price: Number(row.price),
    quantity: requested.get(String(row.id)) as number
  }))

  // numeric(12,2) in Postgres, so settle the rounding here rather than let the
  // database truncate a floating point tail.
  const totalAmount =
    Math.round(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
    ) / 100

  const { data, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      vendor_id: vendorId,
      items,
      total_amount: totalAmount,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      payment_status:
        paymentMethod === "vendor_transfer"
          ? "awaiting_seller_confirmation"
          : "pay_on_delivery",
      buyer_payment_note: payload.buyerPaymentNote ?? null,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    const message = error.message.toLowerCase()
    if (
      message.includes("payment_method") ||
      message.includes("payment_status") ||
      message.includes("buyer_payment_note")
    ) {
      return NextResponse.json(
        { error: "Run the latest Supabase order-payment SQL patch, then place the order again." },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: vendor } = await supabase
    .from("vendor_profiles")
    .select("user_id, store_name")
    .eq("id", vendorId)
    .maybeSingle()

  const { data: buyer } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle()

  if (vendor?.user_id) {
    const buyerName = getDisplayName(buyer?.full_name)
    const orderRef = getOrderRef(String(data.id))

    void sendPushNotification({
      userId: String(vendor.user_id),
      title: "New Order on Afunwa",
      body: `${buyerName} placed Order ${orderRef} in your store.`,
      url: `/orders/${data.id}`
    }).catch(() => null)
  }

  return NextResponse.json({
    ok: true,
    orderId: data.id
  })
}

function getDisplayName(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : ""
  if (!normalized) {
    return "A buyer"
  }

  const firstName = normalized.split(/\s+/)[0] ?? normalized
  return firstName.length > 18 ? `${firstName.slice(0, 18)}…` : firstName
}

function getOrderRef(orderId: string) {
  return `#${orderId.slice(0, 6).toUpperCase()}`
}
