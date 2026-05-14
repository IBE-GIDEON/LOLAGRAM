import {
  type AccountType,
  type OrderItem,
  type PaymentMethod,
  type PaymentStatus,
  type OrderStatus,
  type VendorCategory
} from "@/lib/types"

export const BRAND = {
  primary: "#25D366",
  background: "#FFFFFF",
  secondaryBackground: "#F5F7F6",
  textPrimary: "#111B21",
  textSecondary: "#667781",
  whatsapp: "#25D366",
  success: "#3A6B4A",
  warning: "#9B7D0A"
} as const

export const APP_NAME = "LOLAGRAM"
export const DEMO_OTP = "123456"
export const DEMO_STATE_KEY = "lolagram-demo-state"
export const DEMO_USER_KEY = "lolagram-demo-user"
export const AUTH_SNAPSHOT_KEY = "lolagram-auth-snapshot"
export const VIEW_MODE_KEY = "lolagram-view-mode"
export const CART_KEY = "lolagram-cart"
export const OFFLINE_DB_NAME = "lolagram-offline"
export const OFFLINE_ORDER_STORE = "order-intents"
export const THEME_KEY = "lolagram-theme"

export const CATEGORY_OPTIONS: Array<{
  label: string
  value: VendorCategory
}> = [
  { label: "Cosmetics", value: "cosmetics" },
  { label: "Wigs", value: "wigs" },
  { label: "Jewellery", value: "jewellery" },
  { label: "Watches", value: "watches" },
  { label: "Fashion", value: "fashion" },
  { label: "Other", value: "other" }
]

export const ACCOUNT_TYPE_OPTIONS: Array<{
  label: string
  value: AccountType
}> = [
  { label: "Buyer", value: "buyer" },
  { label: "Seller", value: "seller" }
]

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800"
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-sky-100 text-sky-800"
  },
  dispatched: {
    label: "Dispatched",
    className: "bg-orange-100 text-orange-800"
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-100 text-emerald-800"
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-100 text-rose-800"
  }
}

export const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  { label: string; helper: string }
> = {
  pay_on_delivery: {
    label: "Pay on Delivery",
    helper: "Inspect the item first, then pay when it arrives."
  },
  vendor_transfer: {
    label: "Pay Vendor Directly",
    helper: "Pay the seller after they confirm your order."
  }
}

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; className: string; helper: string }
> = {
  awaiting_seller_confirmation: {
    label: "Waiting for Seller",
    className: "bg-slate-100 text-slate-800",
    helper: "Your seller needs to confirm before any payment moves."
  },
  pay_on_delivery: {
    label: "Pay on Delivery",
    className: "bg-emerald-100 text-emerald-800",
    helper: "Payment happens at delivery."
  },
  awaiting_vendor_payment: {
    label: "Awaiting Vendor Payment",
    className: "bg-amber-100 text-amber-800",
    helper: "Pay the seller directly and let them confirm receipt."
  },
  paid_to_vendor: {
    label: "Paid to Vendor",
    className: "bg-sky-100 text-sky-800",
    helper: "The seller marked your direct payment as received."
  }
}

export function normalizeOrderStatus(value: unknown): OrderStatus {
  return value === "confirmed" ||
    value === "dispatched" ||
    value === "delivered" ||
    value === "cancelled"
    ? value
    : "pending"
}

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  return value === "vendor_transfer" ? "vendor_transfer" : "pay_on_delivery"
}

export function normalizePaymentStatus(
  value: unknown,
  paymentMethod: PaymentMethod
): PaymentStatus {
  if (
    value === "awaiting_seller_confirmation" ||
    value === "pay_on_delivery" ||
    value === "awaiting_vendor_payment" ||
    value === "paid_to_vendor"
  ) {
    return value
  }

  if (value === "awaiting_confirmation") {
    return "awaiting_seller_confirmation"
  }

  if (value === "paid" || value === "paid_to_platform" || value === "payment_received") {
    return paymentMethod === "vendor_transfer" ? "paid_to_vendor" : "pay_on_delivery"
  }

  return paymentMethod === "vendor_transfer"
    ? "awaiting_seller_confirmation"
    : "pay_on_delivery"
}

export function normalizeOrderItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item)
    )
    .map((item, index) => ({
      productId: String(item.productId ?? item.product_id ?? `item-${index}`),
      name: String(item.name ?? "Item"),
      price: Number(item.price ?? 0),
      quantity: Math.max(1, Number(item.quantity ?? 1))
    }))
}

export function getOrderStatusMeta(value: unknown) {
  return ORDER_STATUS_META[normalizeOrderStatus(value)]
}

export function getPaymentMethodMeta(value: unknown) {
  return PAYMENT_METHOD_META[normalizePaymentMethod(value)]
}

export function getPaymentStatusMeta(value: unknown, paymentMethod: unknown) {
  return PAYMENT_STATUS_META[
    normalizePaymentStatus(value, normalizePaymentMethod(paymentMethod))
  ]
}

export const BOTTOM_NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/orders", label: "Orders" },
  { href: "/profile", label: "Profile" }
] as const
