"use client"

import { createId } from "@/lib/utils"
import {
  createOrderDemo,
  deleteProductDemo,
  getBuyerOrdersDemo,
  getDemoUserById,
  getDemoUserByPhone,
  getOrderByIdDemo,
  getSellerOrdersDemo,
  getSellerProductsDemo,
  getStoreAnalyticsDemo,
  getVendorByUserId,
  getVendorDetailDemo,
  getVendorSnapshots,
  saveProductDemo,
  saveReviewDemo,
  saveSellerProfileDemo,
  updateOrderStatusDemo,
  upsertDemoUser
} from "@/lib/demo-store"
import { env, hasSupabase } from "@/lib/env"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  type AuthFormValues,
  type CheckoutPayload,
  type OrderDetail,
  type OrderStatus,
  type PaystackInitializeResponse,
  type ProductInput,
  type SellerProfileInput,
  type StoreAnalytics,
  type UserProfile,
  type VendorDetail,
  type VendorProfile,
  type VendorSnapshot
} from "@/lib/types"

function mapUser(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    phone: String(row.phone ?? ""),
    fullName: String(row.full_name ?? ""),
    profilePhotoUrl: row.profile_photo_url ? String(row.profile_photo_url) : undefined,
    accountType: String(row.account_type ?? "buyer") as UserProfile["accountType"],
    createdAt: String(row.created_at ?? new Date().toISOString())
  }
}

function mapVendor(row: Record<string, unknown>): VendorProfile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    storeName: String(row.store_name),
    storePhotoUrl: row.store_photo_url ? String(row.store_photo_url) : undefined,
    bio: row.bio ? String(row.bio) : undefined,
    category: String(row.category) as VendorProfile["category"],
    city: String(row.city),
    whatsappNumber: String(row.whatsapp_number),
    isActive: Boolean(row.is_active),
    totalSales: Number(row.total_sales ?? 0),
    rating: Number(row.rating ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString())
  }
}

export async function loadVendors(query = ""): Promise<VendorSnapshot[]> {
  if (!hasSupabase) {
    return getVendorSnapshots(query)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return getVendorSnapshots(query)

  let request = supabase
    .from("vendor_profiles")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (query.trim()) {
    request = request.textSearch("search_text", query.trim(), {
      type: "websearch"
    })
  }

  const { data, error } = await request.limit(100)
  if (error || !data) {
    return getVendorSnapshots(query)
  }

  return data.map((row) => ({
    ...mapVendor(row),
    reviewCount: 0,
    productCount: 0
  }))
}

export async function loadVendorDetail(vendorId: string): Promise<VendorDetail | null> {
  if (!hasSupabase) {
    return getVendorDetailDemo(vendorId)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return getVendorDetailDemo(vendorId)

  const [{ data: vendor }, { data: products }, { data: reviews }] = await Promise.all([
    supabase.from("vendor_profiles").select("*").eq("id", vendorId).maybeSingle(),
    supabase
      .from("products")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
  ])

  if (!vendor) return null

  const mappedVendor = mapVendor(vendor)
  return {
    vendor: mappedVendor,
    products:
      products?.map((product) => ({
        id: String(product.id),
        vendorId: String(product.vendor_id),
        name: String(product.name),
        description: String(product.description ?? ""),
        price: Number(product.price ?? 0),
        photoUrl: product.photo_url ? String(product.photo_url) : undefined,
        inStock: Boolean(product.in_stock),
        createdAt: String(product.created_at ?? new Date().toISOString())
      })) ?? [],
    reviews:
      reviews?.map((review) => ({
        id: String(review.id),
        orderId: String(review.order_id),
        buyerId: String(review.buyer_id),
        vendorId: String(review.vendor_id),
        rating: Number(review.rating),
        comment: String(review.comment ?? ""),
        createdAt: String(review.created_at ?? new Date().toISOString()),
        buyerName: "Buyer"
      })) ?? [],
    averageRating: mappedVendor.rating,
    reviewCount: reviews?.length ?? 0
  }
}

export async function loadBuyerOrders(userId: string): Promise<OrderDetail[]> {
  if (!hasSupabase) {
    return getBuyerOrdersDemo(userId)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return getBuyerOrdersDemo(userId)
  const { data, error } = await supabase
    .from("orders")
    .select("*, vendor_profiles(*)")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })

  if (error || !data) return getBuyerOrdersDemo(userId)

  return data.map((order) => ({
    id: String(order.id),
    buyerId: String(order.buyer_id),
    vendorId: String(order.vendor_id),
    items: (order.items ?? []) as OrderDetail["items"],
    totalAmount: Number(order.total_amount ?? 0),
    status: String(order.status) as OrderStatus,
    paystackReference: order.paystack_reference
      ? String(order.paystack_reference)
      : undefined,
    deliveryAddress: String(order.delivery_address ?? ""),
    createdAt: String(order.created_at ?? new Date().toISOString()),
    vendor: order.vendor_profiles ? mapVendor(order.vendor_profiles) : undefined
  }))
}

export async function loadSellerOrders(userId: string): Promise<OrderDetail[]> {
  if (!hasSupabase) {
    return getSellerOrdersDemo(userId)
  }

  const vendor = await loadVendorProfile(userId)
  if (!vendor) return []

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return getSellerOrdersDemo(userId)

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  if (error || !data) return getSellerOrdersDemo(userId)

  return data.map((order) => ({
    id: String(order.id),
    buyerId: String(order.buyer_id),
    vendorId: String(order.vendor_id),
    items: (order.items ?? []) as OrderDetail["items"],
    totalAmount: Number(order.total_amount ?? 0),
    status: String(order.status) as OrderStatus,
    paystackReference: order.paystack_reference
      ? String(order.paystack_reference)
      : undefined,
    deliveryAddress: String(order.delivery_address ?? ""),
    createdAt: String(order.created_at ?? new Date().toISOString()),
    vendor
  }))
}

export async function loadOrderDetail(orderId: string) {
  if (!hasSupabase) {
    return getOrderByIdDemo(orderId)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return getOrderByIdDemo(orderId)

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return getOrderByIdDemo(orderId)

  return {
    id: String(data.id),
    buyerId: String(data.buyer_id),
    vendorId: String(data.vendor_id),
    items: (data.items ?? []) as OrderDetail["items"],
    totalAmount: Number(data.total_amount ?? 0),
    status: String(data.status) as OrderStatus,
    paystackReference: data.paystack_reference
      ? String(data.paystack_reference)
      : undefined,
    deliveryAddress: String(data.delivery_address ?? ""),
    createdAt: String(data.created_at ?? new Date().toISOString())
  } satisfies OrderDetail
}

export async function loadSellerProducts(userId: string) {
  if (!hasSupabase) {
    return getSellerProductsDemo(userId)
  }

  const vendor = await loadVendorProfile(userId)
  if (!vendor) return []

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return getSellerProductsDemo(userId)
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  if (error || !data) return getSellerProductsDemo(userId)

  return data.map((product) => ({
    id: String(product.id),
    vendorId: String(product.vendor_id),
    name: String(product.name),
    description: String(product.description ?? ""),
    price: Number(product.price ?? 0),
    photoUrl: product.photo_url ? String(product.photo_url) : undefined,
    inStock: Boolean(product.in_stock),
    createdAt: String(product.created_at ?? new Date().toISOString())
  }))
}

export async function loadStoreAnalytics(userId: string): Promise<StoreAnalytics> {
  if (!hasSupabase) {
    return getStoreAnalyticsDemo(userId)
  }

  const orders = await loadSellerOrders(userId)
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    averageRating: orders[0]?.vendor?.rating ?? 0
  }
}

export async function loadVendorProfile(userId: string) {
  if (!hasSupabase) {
    return getVendorByUserId(userId)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return getVendorByUserId(userId)
  const { data, error } = await supabase
    .from("vendor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return getVendorByUserId(userId)
  return mapVendor(data)
}

export async function findOrCreateDemoUser(values: AuthFormValues) {
  const existing = getDemoUserByPhone(values.phone)
  if (existing) {
    return existing
  }

  const user: UserProfile = {
    id: createId("user"),
    phone: values.phone,
    fullName: values.fullName,
    accountType: values.accountType,
    createdAt: new Date().toISOString()
  }

  return upsertDemoUser(user)
}

export async function loadUserProfile(userId: string) {
  if (!hasSupabase) {
    return getDemoUserById(userId)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return getDemoUserById(userId)
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error || !data) return getDemoUserById(userId)
  return mapUser(data)
}

export async function saveUserProfile(input: UserProfile) {
  if (!hasSupabase) {
    return upsertDemoUser(input)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return upsertDemoUser(input)

  const { data, error } = await supabase
    .from("users")
    .upsert({
      id: input.id,
      phone: input.phone,
      full_name: input.fullName,
      profile_photo_url: input.profilePhotoUrl,
      account_type: input.accountType
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to save profile")
  }

  return mapUser(data)
}

export async function saveSellerProfile(
  userId: string,
  input: SellerProfileInput
): Promise<VendorProfile> {
  if (!hasSupabase) {
    return saveSellerProfileDemo(userId, input)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return saveSellerProfileDemo(userId, input)

  const { data, error } = await supabase
    .from("vendor_profiles")
    .upsert({
      user_id: userId,
      store_name: input.storeName,
      category: input.category,
      store_photo_url: input.storePhotoUrl,
      bio: input.bio,
      city: input.city,
      whatsapp_number: input.whatsappNumber,
      is_active: true
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to save seller profile")
  }

  return mapVendor(data)
}

export async function saveProduct(input: ProductInput) {
  if (!hasSupabase) {
    return saveProductDemo(input)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return saveProductDemo(input)

  const payload = {
    vendor_id: input.vendorId,
    name: input.name,
    description: input.description,
    price: input.price,
    photo_url: input.photoUrl,
    in_stock: input.inStock
  }

  const response = input.id
    ? await supabase.from("products").update(payload).eq("id", input.id).select().single()
    : await supabase.from("products").insert(payload).select().single()

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Unable to save product")
  }

  return {
    id: String(response.data.id),
    vendorId: String(response.data.vendor_id),
    name: String(response.data.name),
    description: String(response.data.description ?? ""),
    price: Number(response.data.price ?? 0),
    photoUrl: response.data.photo_url ? String(response.data.photo_url) : undefined,
    inStock: Boolean(response.data.in_stock),
    createdAt: String(response.data.created_at ?? new Date().toISOString())
  }
}

export async function deleteProduct(productId: string) {
  if (!hasSupabase) {
    return deleteProductDemo(productId)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return deleteProductDemo(productId)
  const { error } = await supabase.from("products").delete().eq("id", productId)
  if (error) {
    throw new Error(error.message)
  }
  return true
}

export async function startCheckout(
  payload: CheckoutPayload
): Promise<PaystackInitializeResponse> {
  if (!hasSupabase) {
    const order = createOrderDemo({
      buyerId: payload.buyerId,
      vendorId: payload.vendorId,
      items: payload.items,
      totalAmount: payload.totalAmount,
      status: "pending",
      paystackReference: createId("paystack"),
      deliveryAddress: payload.deliveryAddress
    })

    return {
      checkoutUrl: `${env.appUrl}/order-confirmation/${order.id}`,
      orderId: order.id,
      reference: order.paystackReference ?? createId("ref")
    }
  }

  const response = await fetch("/api/paystack/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error("Unable to start checkout")
  }

  return (await response.json()) as PaystackInitializeResponse
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!hasSupabase) {
    return updateOrderStatusDemo(orderId, status)
  }

  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  })

  if (!response.ok) {
    throw new Error("Unable to update order status")
  }

  return response.json()
}

export async function saveReview(input: {
  orderId: string
  buyerId: string
  vendorId: string
  rating: number
  comment: string
}) {
  if (!hasSupabase) {
    return saveReviewDemo(input)
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return saveReviewDemo(input)
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      order_id: input.orderId,
      buyer_id: input.buyerId,
      vendor_id: input.vendorId,
      rating: input.rating,
      comment: input.comment
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to save review")
  }

  return data
}
