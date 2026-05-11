"use client"

import { createId } from "@/lib/utils"
import {
  createOrderDemo,
  deleteProductDemo,
  getBuyerOrdersDemo,
  getDemoUserById,
  getDemoUserByPhone,
  getMarketplaceSearchResults,
  getProductFeed,
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
import { canUseDemoMode, env, hasSupabase } from "@/lib/env"
import {
  normalizeProductPhotoUrls,
  serializeLegacyPhotoUrl
} from "@/lib/product-images"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  type AuthFormValues,
  type CheckoutPayload,
  type MarketplaceSearchResults,
  type OrderDetail,
  type OrderStatus,
  type PaystackInitializeResponse,
  type ProductInput,
  type ProductSearchResult,
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

function mapProduct(row: Record<string, unknown>) {
  const photoUrls = normalizeProductPhotoUrls(
    Array.isArray(row.photo_urls)
      ? row.photo_urls.map((value) => String(value))
      : undefined,
    row.photo_url ? String(row.photo_url) : undefined
  )

  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    name: String(row.name),
    description: String(row.description ?? ""),
    price: Number(row.price ?? 0),
    photoUrl: photoUrls[0],
    photoUrls,
    inStock: Boolean(row.in_stock),
    createdAt: String(row.created_at ?? new Date().toISOString())
  }
}

function getLaunchConfigError(feature: string) {
  return `${feature} needs live Supabase configuration before launch.`
}

function getPaymentsConfigError() {
  return "Checkout needs live Paystack and Supabase configuration before launch."
}

export async function loadVendors(query = ""): Promise<VendorSnapshot[]> {
  if (!hasSupabase) {
    return canUseDemoMode ? getVendorSnapshots(query) : []
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getVendorSnapshots(query) : []

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
    return canUseDemoMode ? getVendorSnapshots(query) : []
  }

  return data.map((row) => ({
    ...mapVendor(row),
    reviewCount: 0,
    productCount: 0
  }))
}

export async function loadMarketplaceSearch(
  query = ""
): Promise<MarketplaceSearchResults> {
  if (!hasSupabase) {
    return canUseDemoMode
      ? getMarketplaceSearchResults(query)
      : { products: [], vendors: [] }
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return canUseDemoMode
      ? getMarketplaceSearchResults(query)
      : { products: [], vendors: [] }
  }

  const normalized = query.trim()
  const vendorRequest = normalized
    ? supabase
        .from("vendor_profiles")
        .select("*")
        .eq("is_active", true)
        .or(
          `store_name.ilike.%${normalized}%,category.ilike.%${normalized}%,city.ilike.%${normalized}%,bio.ilike.%${normalized}%`
        )
        .limit(12)
    : supabase
        .from("vendor_profiles")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6)

  const productRequest = normalized
    ? supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${normalized}%,description.ilike.%${normalized}%`)
        .order("created_at", { ascending: false })
        .limit(18)
    : supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .order("created_at", { ascending: false })
        .limit(10)

  const [
    { data: vendorRows, error: vendorError },
    { data: productRows, error: productError }
  ] = await Promise.all([vendorRequest, productRequest])

  if (vendorError || productError || !vendorRows || !productRows) {
    return canUseDemoMode
      ? getMarketplaceSearchResults(query)
      : { products: [], vendors: [] }
  }

  const relatedVendorProducts =
    normalized && vendorRows.length > 0
      ? await supabase
          .from("products")
          .select("*")
          .in(
            "vendor_id",
            vendorRows.map((vendor) => String(vendor.id))
          )
          .order("created_at", { ascending: false })
          .limit(18)
      : { data: [], error: null }

  if (relatedVendorProducts.error) {
    return canUseDemoMode
      ? getMarketplaceSearchResults(query)
      : { products: [], vendors: [] }
  }

  const mergedProductRows = [...productRows, ...(relatedVendorProducts.data ?? [])].filter(
    (product, index, list) =>
      list.findIndex((candidate) => String(candidate.id) === String(product.id)) ===
      index
  )

  const productVendorIds = [
    ...new Set(mergedProductRows.map((product) => String(product.vendor_id)))
  ]

  const missingVendorIds = productVendorIds.filter(
    (vendorId) => !vendorRows.some((vendor) => String(vendor.id) === vendorId)
  )

  const extraVendorRows =
    missingVendorIds.length > 0
      ? await supabase
          .from("vendor_profiles")
          .select("*")
          .in("id", missingVendorIds)
          .eq("is_active", true)
      : { data: [], error: null }

  if (extraVendorRows.error) {
    return canUseDemoMode
      ? getMarketplaceSearchResults(query)
      : { products: [], vendors: [] }
  }

  const allVendorRows = [...vendorRows, ...(extraVendorRows.data ?? [])]
  const vendorSnapshotMap = new Map(
    allVendorRows.map((row) => {
      const vendor = mapVendor(row)
      const snapshot: VendorSnapshot = {
        ...vendor,
        reviewCount: 0,
        productCount: 0
      }

      return [vendor.id, snapshot]
    })
  )

  const products = mergedProductRows
    .map((row): ProductSearchResult | null => {
      const vendor = vendorSnapshotMap.get(String(row.vendor_id))
      if (!vendor) return null

      return {
        ...mapProduct(row),
        vendor
      } satisfies ProductSearchResult
    })
    .filter((item): item is ProductSearchResult => Boolean(item))
    .sort((left, right) => {
      if (left.inStock !== right.inStock) {
        return left.inStock ? -1 : 1
      }
      return +new Date(right.createdAt) - +new Date(left.createdAt)
    })

  const vendors = [
    ...vendorRows.map((row) => vendorSnapshotMap.get(String(row.id))),
    ...products.map((product) => product.vendor)
  ]
    .filter((vendor): vendor is VendorSnapshot => Boolean(vendor))
    .filter(
      (vendor, index, list) =>
        list.findIndex((candidate) => candidate.id === vendor.id) === index
    )

  return {
    products,
    vendors
  }
}

export async function loadProductFeed(query = ""): Promise<ProductSearchResult[]> {
  const normalized = query.trim()

  if (!hasSupabase) {
    return canUseDemoMode ? getProductFeed(query) : []
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getProductFeed(query) : []

  if (normalized) {
    const results = await loadMarketplaceSearch(query)
    return results.products
  }

  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (productError || !productRows) {
    return canUseDemoMode ? getProductFeed(query) : []
  }

  const vendorIds = [...new Set(productRows.map((product) => String(product.vendor_id)))]

  const { data: vendorRows, error: vendorError } = await supabase
    .from("vendor_profiles")
    .select("*")
    .in("id", vendorIds)
    .eq("is_active", true)

  if (vendorError || !vendorRows) {
    return canUseDemoMode ? getProductFeed(query) : []
  }

  const vendorSnapshotMap = new Map(
    vendorRows.map((row) => {
      const vendor = mapVendor(row)
      const snapshot: VendorSnapshot = {
        ...vendor,
        reviewCount: 0,
        productCount: 0
      }

      return [vendor.id, snapshot]
    })
  )

  return productRows
    .map((row): ProductSearchResult | null => {
      const vendor = vendorSnapshotMap.get(String(row.vendor_id))
      if (!vendor) return null

      return {
        ...mapProduct(row),
        vendor
      }
    })
    .filter((item): item is ProductSearchResult => Boolean(item))
}

export async function loadVendorDetail(vendorId: string): Promise<VendorDetail | null> {
  if (!hasSupabase) {
    return canUseDemoMode ? getVendorDetailDemo(vendorId) : null
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getVendorDetailDemo(vendorId) : null

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
    products: products?.map((product) => mapProduct(product)) ?? [],
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
    return canUseDemoMode ? getBuyerOrdersDemo(userId) : []
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getBuyerOrdersDemo(userId) : []
  const { data, error } = await supabase
    .from("orders")
    .select("*, vendor_profiles(*)")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })

  if (error || !data) return canUseDemoMode ? getBuyerOrdersDemo(userId) : []

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
    return canUseDemoMode ? getSellerOrdersDemo(userId) : []
  }

  const vendor = await loadVendorProfile(userId)
  if (!vendor) return []

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getSellerOrdersDemo(userId) : []

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  if (error || !data) return canUseDemoMode ? getSellerOrdersDemo(userId) : []

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
    return canUseDemoMode ? getOrderByIdDemo(orderId) : null
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getOrderByIdDemo(orderId) : null

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return canUseDemoMode ? getOrderByIdDemo(orderId) : null

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
    return canUseDemoMode ? getSellerProductsDemo(userId) : []
  }

  const vendor = await loadVendorProfile(userId)
  if (!vendor) return []

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getSellerProductsDemo(userId) : []
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  if (error || !data) return canUseDemoMode ? getSellerProductsDemo(userId) : []

  return data.map((product) => mapProduct(product))
}

export async function loadStoreAnalytics(userId: string): Promise<StoreAnalytics> {
  if (!hasSupabase) {
    return canUseDemoMode
      ? getStoreAnalyticsDemo(userId)
      : { totalOrders: 0, totalRevenue: 0, averageRating: 0 }
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
    return canUseDemoMode ? getVendorByUserId(userId) : null
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getVendorByUserId(userId) : null
  const { data, error } = await supabase
    .from("vendor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return canUseDemoMode ? getVendorByUserId(userId) : null
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
    return canUseDemoMode ? getDemoUserById(userId) : null
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getDemoUserById(userId) : null
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error || !data) return canUseDemoMode ? getDemoUserById(userId) : null
  return mapUser(data)
}

export async function saveUserProfile(input: UserProfile) {
  if (!hasSupabase) {
    if (canUseDemoMode) {
      return upsertDemoUser(input)
    }
    throw new Error(getLaunchConfigError("Profile updates"))
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    if (canUseDemoMode) {
      return upsertDemoUser(input)
    }
    throw new Error(getLaunchConfigError("Profile updates"))
  }

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
    if (canUseDemoMode) {
      return saveSellerProfileDemo(userId, input)
    }
    throw new Error(getLaunchConfigError("Seller onboarding"))
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    if (canUseDemoMode) {
      return saveSellerProfileDemo(userId, input)
    }
    throw new Error(getLaunchConfigError("Seller onboarding"))
  }

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
    if (canUseDemoMode) {
      return saveProductDemo(input)
    }
    throw new Error(getLaunchConfigError("Product uploads"))
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    if (canUseDemoMode) {
      return saveProductDemo(input)
    }
    throw new Error(getLaunchConfigError("Product uploads"))
  }

  const payload = {
    vendor_id: input.vendorId,
    name: input.name,
    description: input.description,
    price: input.price,
    photo_url: input.photoUrls[0] ?? input.photoUrl ?? null,
    photo_urls: input.photoUrls,
    in_stock: input.inStock
  }

  let response = input.id
    ? await supabase.from("products").update(payload).eq("id", input.id).select().single()
    : await supabase.from("products").insert(payload).select().single()

  if (
    response.error?.code === "PGRST204" ||
    response.error?.message?.toLowerCase().includes("photo_urls")
  ) {
    const legacyPayload = {
      vendor_id: input.vendorId,
      name: input.name,
      description: input.description,
      price: input.price,
      photo_url: serializeLegacyPhotoUrl(input.photoUrls) ?? input.photoUrl ?? null,
      in_stock: input.inStock
    }

    response = input.id
      ? await supabase
          .from("products")
          .update(legacyPayload)
          .eq("id", input.id)
          .select()
          .single()
      : await supabase.from("products").insert(legacyPayload).select().single()
  }

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Unable to save product")
  }

  return mapProduct(response.data)
}

export async function deleteProduct(productId: string) {
  if (!hasSupabase) {
    if (canUseDemoMode) {
      return deleteProductDemo(productId)
    }
    throw new Error(getLaunchConfigError("Product deletion"))
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    if (canUseDemoMode) {
      return deleteProductDemo(productId)
    }
    throw new Error(getLaunchConfigError("Product deletion"))
  }
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
    if (canUseDemoMode) {
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

    throw new Error(getPaymentsConfigError())
  }

  const response = await fetch("/api/paystack/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(data?.error ?? "Unable to start checkout")
  }

  return (await response.json()) as PaystackInitializeResponse
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!hasSupabase) {
    if (canUseDemoMode) {
      return updateOrderStatusDemo(orderId, status)
    }
    throw new Error(getLaunchConfigError("Order status updates"))
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
    if (canUseDemoMode) {
      return saveReviewDemo(input)
    }
    throw new Error(getLaunchConfigError("Reviews"))
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    if (canUseDemoMode) {
      return saveReviewDemo(input)
    }
    throw new Error(getLaunchConfigError("Reviews"))
  }
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
