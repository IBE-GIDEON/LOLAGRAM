"use client"

import { createId } from "@/lib/utils"
import {
  createOrderDemo,
  deleteProductDemo,
  getBuyerOrdersDemo,
  getDemoUserByEmail,
  getDemoUserById,
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
import { canUseDemoMode, hasSupabase } from "@/lib/env"
import { fetchWithRetry } from "@/lib/fetch-utils"
import {
  normalizeProductPhotoUrls,
  serializeLegacyPhotoUrl
} from "@/lib/product-images"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  normalizeOrderItems,
  normalizeOrderStatus,
  normalizePaymentMethod,
  normalizePaymentStatus
} from "@/lib/constants"
import {
  type CheckoutPayload,
  type OrderArchiveActor,
  type MarketplaceSearchResults,
  type OrderDetail,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  type PlaceOrderResponse,
  type ProductInput,
   type ProductSearchResult,
  type ReviewWithBuyer,
  type SellerProfileInput,
  type SignUpFormValues,
  type StoreAnalytics,
  type UserProfile,
  type VendorDetail,
  type VendorProfile,
  type VendorSnapshot
} from "@/lib/types"

type SupabaseBrowserClient = NonNullable<ReturnType<typeof getSupabaseBrowserClient>>

function mapUser(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email ?? row.recovery_email ?? ""),
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
    bankName: row.bank_name ? String(row.bank_name) : undefined,
    accountName: row.account_name ? String(row.account_name) : undefined,
    accountNumber: row.account_number ? String(row.account_number) : undefined,
    paymentNote: row.payment_note ? String(row.payment_note) : undefined,
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function normalizeCachedUser(value: unknown): UserProfile | null {
  const row = asRecord(value)
  if (!row?.id) {
    return null
  }

  return {
    id: String(row.id),
    email: String(row.email ?? row.recovery_email ?? ""),
    phone: String(row.phone ?? ""),
    fullName: String(row.fullName ?? row.full_name ?? ""),
    profilePhotoUrl: row.profilePhotoUrl
      ? String(row.profilePhotoUrl)
      : row.profile_photo_url
        ? String(row.profile_photo_url)
        : undefined,
    accountType: String(
      row.accountType ?? row.account_type ?? "buyer"
    ) as UserProfile["accountType"],
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString())
  }
}

function normalizeCachedVendor(value: unknown): VendorProfile | null {
  const row = asRecord(value)
  if (!row?.id || !(row.userId ?? row.user_id)) {
    return null
  }

  return {
    id: String(row.id),
    userId: String(row.userId ?? row.user_id),
    storeName: String(row.storeName ?? row.store_name ?? "Vendor"),
    storePhotoUrl: row.storePhotoUrl
      ? String(row.storePhotoUrl)
      : row.store_photo_url
        ? String(row.store_photo_url)
        : undefined,
    bio: row.bio ? String(row.bio) : undefined,
    category: String(
      row.category ?? "other"
    ) as VendorProfile["category"],
    city: String(row.city ?? ""),
    whatsappNumber: String(row.whatsappNumber ?? row.whatsapp_number ?? ""),
    bankName: row.bankName
      ? String(row.bankName)
      : row.bank_name
        ? String(row.bank_name)
        : undefined,
    accountName: row.accountName
      ? String(row.accountName)
      : row.account_name
        ? String(row.account_name)
        : undefined,
    accountNumber: row.accountNumber
      ? String(row.accountNumber)
      : row.account_number
        ? String(row.account_number)
        : undefined,
    paymentNote: row.paymentNote
      ? String(row.paymentNote)
      : row.payment_note
        ? String(row.payment_note)
        : undefined,
    isActive: Boolean(row.isActive ?? row.is_active ?? true),
    totalSales: Number(row.totalSales ?? row.total_sales ?? 0),
    rating: Number(row.rating ?? 0),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString())
  }
}

function normalizeCachedReview(value: unknown): ReviewWithBuyer | null {
  const row = asRecord(value)
  if (!row?.id) {
    return null
  }

  return {
    id: String(row.id),
    orderId: String(row.orderId ?? row.order_id ?? ""),
    buyerId: String(row.buyerId ?? row.buyer_id ?? ""),
    vendorId: String(row.vendorId ?? row.vendor_id ?? ""),
    rating: Math.max(1, Number(row.rating ?? 0)),
    comment: String(row.comment ?? ""),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    buyerName: getReviewerDisplayName(
      row.buyerName
        ? String(row.buyerName)
        : row.buyer_name
          ? String(row.buyer_name)
          : undefined
    )
  }
}

function normalizeCachedOrder(value: unknown): OrderDetail | null {
  const row = asRecord(value)
  if (!row?.id || !(row.buyerId ?? row.buyer_id) || !(row.vendorId ?? row.vendor_id)) {
    return null
  }

  const paymentMethod = normalizePaymentMethod(
    row.paymentMethod ?? row.payment_method
  )

  return {
    id: String(row.id),
    buyerId: String(row.buyerId ?? row.buyer_id),
    vendorId: String(row.vendorId ?? row.vendor_id),
    items: normalizeOrderItems(row.items),
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    status: normalizeOrderStatus(row.status),
    paymentMethod,
    paymentStatus: normalizePaymentStatus(
      row.paymentStatus ?? row.payment_status,
      paymentMethod
    ),
    paymentReference:
      row.paymentReference || row.payment_reference || row.paystack_reference
        ? String(
            row.paymentReference ?? row.payment_reference ?? row.paystack_reference
          )
        : undefined,
    buyerPaymentNote: row.buyerPaymentNote
      ? String(row.buyerPaymentNote)
      : row.buyer_payment_note
        ? String(row.buyer_payment_note)
        : undefined,
    deliveryAddress: String(
      row.deliveryAddress ?? row.delivery_address ?? ""
    ),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    vendor: normalizeCachedVendor(row.vendor ?? row.vendor_profiles) ?? undefined,
    buyer: normalizeCachedUser(row.buyer) ?? undefined
  }
}

function normalizeCachedOrderList(value: unknown): OrderDetail[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((order) => normalizeCachedOrder(order))
    .filter((order): order is OrderDetail => Boolean(order))
}

function readPersistedOrderList(key: string): OrderDetail[] | null {
  const rawValue = readPersistedCache<unknown>(key)
  if (rawValue === null) {
    return null
  }

  const orders = normalizeCachedOrderList(rawValue)
  return orders.length > 0 ? orders : null
}

function normalizeCachedVendorDetail(value: unknown): VendorDetail | null {
  const row = asRecord(value)
  if (!row) {
    return null
  }

  const vendor = normalizeCachedVendor(row.vendor)
  if (!vendor) {
    return null
  }

  const products = Array.isArray(row.products)
    ? row.products
        .map((product) => {
          const productRow = asRecord(product)
          return productRow ? mapProduct(productRow) : null
        })
        .filter(
          (product): product is ReturnType<typeof mapProduct> => Boolean(product)
        )
    : []

  const reviews = Array.isArray(row.reviews)
    ? row.reviews
        .map((review) => normalizeCachedReview(review))
        .filter((review): review is ReviewWithBuyer => Boolean(review))
    : []

  return {
    vendor,
    owner: normalizeCachedUser(row.owner) ?? undefined,
    products,
    reviews,
    reviewCount: Number(row.reviewCount ?? row.review_count ?? reviews.length),
    averageRating: Number(row.averageRating ?? row.average_rating ?? vendor.rating)
  }
}

function getReviewerDisplayName(rawName?: string | null) {
  const normalized = rawName?.trim()
  if (!normalized) {
    return "Buyer"
  }

  const firstName = normalized.split(/\s+/)[0] ?? normalized
  return firstName.length > 18 ? `${firstName.slice(0, 18)}…` : firstName
}

function getLaunchConfigError(feature: string) {
  return `${feature} needs live Supabase configuration before launch.`
}

function getOrderPlacementError() {
  return "Order placement needs live Supabase configuration before launch."
}

const CACHE_TTL_MS = 120_000

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const vendorListCache = new Map<string, CacheEntry<VendorSnapshot[]>>()
const marketplaceSearchCache = new Map<string, CacheEntry<MarketplaceSearchResults>>()
const productFeedCache = new Map<string, CacheEntry<ProductSearchResult[]>>()
const vendorDetailCache = new Map<string, CacheEntry<VendorDetail | null>>()
const buyerOrdersCache = new Map<string, CacheEntry<OrderDetail[]>>()
const sellerOrdersCache = new Map<string, CacheEntry<OrderDetail[]>>()
const orderDetailCache = new Map<string, CacheEntry<OrderDetail | null>>()
const sellerProductsCache = new Map<string, CacheEntry<ReturnType<typeof mapProduct>[]>>()
const storeAnalyticsCache = new Map<string, CacheEntry<StoreAnalytics>>()
const vendorProfileCache = new Map<string, CacheEntry<VendorProfile | null>>()
const userProfileCache = new Map<string, CacheEntry<UserProfile | null>>()

// Prevents duplicate in-flight requests for the same key
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inFlight = new Map<string, Promise<any>>()
const HIDDEN_ORDERS_KEY = "lolagram-hidden-orders"
const PERSISTED_CACHE_KEY = "lolagram-persisted-cache-v1"
const PERSISTED_CACHE_TTL_MS = 10 * 60 * 1000

type PersistedCacheEntry = {
  value: unknown
  expiresAt: number
}

type PersistedCacheStore = Record<string, PersistedCacheEntry>

const persistedCacheKeys = {
  vendors: (query: string) => `vendors:${query}`,
  marketplaceSearch: (query: string) => `marketplace-search:${query}`,
  productFeed: (query: string) => `product-feed:${query}`,
  vendorDetail: (vendorId: string) => `vendor-detail:${vendorId}`,
  buyerOrders: (userId: string) => `buyer-orders:${userId}`,
  sellerOrders: (userId: string) => `seller-orders:${userId}`,
  orderDetail: (orderId: string) => `order-detail:${orderId}`,
  sellerProducts: (userId: string) => `seller-products:${userId}`,
  storeAnalytics: (userId: string) => `store-analytics:${userId}`,
  vendorProfile: (userId: string) => `vendor-profile:${userId}`,
  userProfile: (userId: string) => `user-profile:${userId}`
} as const

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }

  return entry.value
}

function writeCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): T {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  })
  return value
}

function getPersistedCacheStore(): PersistedCacheStore {
  if (typeof window === "undefined") {
    return {}
  }

  const raw = window.localStorage.getItem(PERSISTED_CACHE_KEY)
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw) as PersistedCacheStore
  } catch {
    return {}
  }
}

function savePersistedCacheStore(store: PersistedCacheStore) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(PERSISTED_CACHE_KEY, JSON.stringify(store))
}

function readPersistedCache<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null
  }

  const store = getPersistedCacheStore()
  const entry = store[key]
  if (!entry) {
    return null
  }

  if (entry.expiresAt <= Date.now()) {
    delete store[key]
    savePersistedCacheStore(store)
    return null
  }

  return entry.value as T
}

function writePersistedCache<T>(
  key: string,
  value: T,
  ttlMs = PERSISTED_CACHE_TTL_MS
): T {
  if (typeof window === "undefined") {
    return value
  }

  const store = getPersistedCacheStore()
  store[key] = {
    value,
    expiresAt: Date.now() + ttlMs
  }
  savePersistedCacheStore(store)
  return value
}

function deletePersistedCache(key: string) {
  if (typeof window === "undefined") {
    return
  }

  const store = getPersistedCacheStore()
  if (!(key in store)) {
    return
  }

  delete store[key]
  savePersistedCacheStore(store)
}

function clearPersistedCacheByPrefix(prefix: string) {
  if (typeof window === "undefined") {
    return
  }

  const store = getPersistedCacheStore()
  let changed = false

  for (const key of Object.keys(store)) {
    if (!key.startsWith(prefix)) {
      continue
    }

    delete store[key]
    changed = true
  }

  if (changed) {
    savePersistedCacheStore(store)
  }
}

function readHybridCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  persistedKey: string
): T | null {
  const memoryValue = readCache(cache, key)
  if (memoryValue !== null) {
    return memoryValue
  }

  const persistedValue = readPersistedCache<T>(persistedKey)
  if (persistedValue === null) {
    return null
  }

  return writeCache(cache, key, persistedValue)
}

function writeHybridCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  persistedKey: string,
  value: T,
  ttlMs = PERSISTED_CACHE_TTL_MS
): T {
  writeCache(cache, key, value)
  return writePersistedCache(persistedKey, value, ttlMs)
}

function deduplicatedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key)
  if (existing) return existing as Promise<T>
  const promise = fetcher().finally(() => inFlight.delete(key))
  inFlight.set(key, promise)
  return promise
}

type HiddenOrdersStore = {
  buyer: Record<string, string[]>
  seller: Record<string, string[]>
}

function getHiddenOrdersStore(): HiddenOrdersStore {
  if (typeof window === "undefined") {
    return { buyer: {}, seller: {} }
  }

  const raw = window.localStorage.getItem(HIDDEN_ORDERS_KEY)
  if (!raw) {
    return { buyer: {}, seller: {} }
  }

  try {
    const parsed = JSON.parse(raw) as HiddenOrdersStore
    return {
      buyer: parsed.buyer ?? {},
      seller: parsed.seller ?? {}
    }
  } catch {
    return { buyer: {}, seller: {} }
  }
}

function saveHiddenOrdersStore(store: HiddenOrdersStore) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(HIDDEN_ORDERS_KEY, JSON.stringify(store))
}

function getHiddenOrderIds(actor: OrderArchiveActor, userId: string) {
  return new Set(getHiddenOrdersStore()[actor][userId] ?? [])
}

function hideOrderLocally(actor: OrderArchiveActor, userId: string, orderId: string) {
  const store = getHiddenOrdersStore()
  const current = new Set(store[actor][userId] ?? [])
  current.add(orderId)
  store[actor][userId] = [...current]
  saveHiddenOrdersStore(store)
}

function clearMarketplaceDiscoveryCaches() {
  vendorListCache.clear()
  marketplaceSearchCache.clear()
  productFeedCache.clear()
  clearPersistedCacheByPrefix("vendors:")
  clearPersistedCacheByPrefix("marketplace-search:")
  clearPersistedCacheByPrefix("product-feed:")
}

function clearOrderCaches() {
  buyerOrdersCache.clear()
  sellerOrdersCache.clear()
  orderDetailCache.clear()
  storeAnalyticsCache.clear()
  clearPersistedCacheByPrefix("buyer-orders:")
  clearPersistedCacheByPrefix("seller-orders:")
  clearPersistedCacheByPrefix("order-detail:")
  clearPersistedCacheByPrefix("store-analytics:")
}

function logMarketplaceError(scope: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    console.error(`[lolagram:${scope}]`, error)
    return
  }

  console.warn(`[lolagram:${scope}]`, error)
}

function mapOrder(row: Record<string, unknown>, vendor?: VendorProfile): OrderDetail {
  const nestedVendor =
    vendor ??
    (row.vendor_profiles &&
    typeof row.vendor_profiles === "object" &&
    !Array.isArray(row.vendor_profiles)
      ? mapVendor(row.vendor_profiles as Record<string, unknown>)
      : undefined)

  const paymentMethod = normalizePaymentMethod(row.payment_method)
  const paymentStatus = normalizePaymentStatus(row.payment_status, paymentMethod)

  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    vendorId: String(row.vendor_id),
    items: normalizeOrderItems(row.items),
    totalAmount: Number(row.total_amount ?? 0),
    status: normalizeOrderStatus(row.status),
    paymentMethod,
    paymentStatus,
    paymentReference: (row.payment_reference ?? row.paystack_reference)
      ? String(row.payment_reference ?? row.paystack_reference)
      : undefined,
    buyerPaymentNote: row.buyer_payment_note
      ? String(row.buyer_payment_note)
      : undefined,
    deliveryAddress: String(row.delivery_address ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    vendor: nestedVendor
  }
}

async function fetchVendorProfileById(
  supabase: SupabaseBrowserClient,
  vendorId: string
) {
  const { data, error } = await supabase
    .from("vendor_profiles")
    .select("*")
    .eq("id", vendorId)
    .maybeSingle()

  if (error || !data) {
    if (error) {
      logMarketplaceError("fetch-vendor-for-order", error)
    }
    return undefined
  }

  return mapVendor(data)
}

async function mapOrderWithVendorFallback(
  supabase: SupabaseBrowserClient,
  row: Record<string, unknown>,
  vendor?: VendorProfile
) {
  const mappedOrder = mapOrder(row, vendor)

  if (mappedOrder.vendor) {
    return mappedOrder
  }

  const fallbackVendor = await fetchVendorProfileById(supabase, mappedOrder.vendorId)
  return fallbackVendor ? { ...mappedOrder, vendor: fallbackVendor } : mappedOrder
}

function refreshVendorReferences(vendor: VendorProfile) {
  const cachedDetail = readCache(vendorDetailCache, vendor.id)
  if (cachedDetail) {
    writeHybridCache(
      vendorDetailCache,
      vendor.id,
      persistedCacheKeys.vendorDetail(vendor.id),
      {
      ...cachedDetail,
      vendor
      }
    )
  }

  for (const [key, entry] of buyerOrdersCache) {
    if (entry.expiresAt <= Date.now()) {
      buyerOrdersCache.delete(key)
      continue
    }

    if (!entry.value.some((order) => order.vendorId === vendor.id)) {
      continue
    }

    writeHybridCache(
      buyerOrdersCache,
      key,
      persistedCacheKeys.buyerOrders(key),
      entry.value.map((order) =>
        order.vendorId === vendor.id ? { ...order, vendor } : order
      )
    )
  }

  for (const [key, entry] of sellerOrdersCache) {
    if (entry.expiresAt <= Date.now()) {
      sellerOrdersCache.delete(key)
      continue
    }

    if (!entry.value.some((order) => order.vendorId === vendor.id)) {
      continue
    }

    writeHybridCache(
      sellerOrdersCache,
      key,
      persistedCacheKeys.sellerOrders(key),
      entry.value.map((order) =>
        order.vendorId === vendor.id ? { ...order, vendor } : order
      )
    )
  }

  for (const [key, entry] of orderDetailCache) {
    if (entry.expiresAt <= Date.now()) {
      orderDetailCache.delete(key)
      continue
    }

    if (entry.value?.vendorId !== vendor.id) {
      continue
    }

    writeHybridCache(orderDetailCache, key, persistedCacheKeys.orderDetail(key), {
      ...entry.value,
      vendor
    })
  }
}

function cacheVendorProfile(vendor: VendorProfile | null, userId: string) {
  writeCache(vendorProfileCache, userId, vendor)
  if (vendor) {
    writePersistedCache(persistedCacheKeys.vendorProfile(userId), vendor)
  } else {
    deletePersistedCache(persistedCacheKeys.vendorProfile(userId))
  }
  if (vendor) {
    refreshVendorReferences(vendor)
  }
  return vendor
}

function cacheUserProfile(user: UserProfile | null, userId: string) {
  writeCache(userProfileCache, userId, user)
  if (user) {
    writePersistedCache(persistedCacheKeys.userProfile(userId), user)
  } else {
    deletePersistedCache(persistedCacheKeys.userProfile(userId))
  }
  return user
}

function updateCachedOrderCollections(
  orderId: string,
  updater: (order: OrderDetail) => OrderDetail
) {
  const cachedOrder = readCache(orderDetailCache, orderId)
  if (cachedOrder) {
    writeHybridCache(
      orderDetailCache,
      orderId,
      persistedCacheKeys.orderDetail(orderId),
      updater(cachedOrder)
    )
  }

  for (const [key, entry] of buyerOrdersCache) {
    if (entry.expiresAt <= Date.now()) {
      buyerOrdersCache.delete(key)
      continue
    }

    if (!entry.value.some((order) => order.id === orderId)) {
      continue
    }

    writeHybridCache(
      buyerOrdersCache,
      key,
      persistedCacheKeys.buyerOrders(key),
      entry.value.map((order) => (order.id === orderId ? updater(order) : order))
    )
  }

  for (const [key, entry] of sellerOrdersCache) {
    if (entry.expiresAt <= Date.now()) {
      sellerOrdersCache.delete(key)
      continue
    }

    if (!entry.value.some((order) => order.id === orderId)) {
      continue
    }

    writeHybridCache(
      sellerOrdersCache,
      key,
      persistedCacheKeys.sellerOrders(key),
      entry.value.map((order) => (order.id === orderId ? updater(order) : order))
    )
  }
}

function removeOrderFromVisibleCaches(orderId: string, actor: OrderArchiveActor) {
  orderDetailCache.delete(orderId)
  deletePersistedCache(persistedCacheKeys.orderDetail(orderId))

  if (actor === "buyer") {
    for (const [key, entry] of buyerOrdersCache) {
      if (entry.expiresAt <= Date.now()) {
        buyerOrdersCache.delete(key)
        continue
      }

      if (!entry.value.some((order) => order.id === orderId)) {
        continue
      }

      writeHybridCache(
        buyerOrdersCache,
        key,
        persistedCacheKeys.buyerOrders(key),
        entry.value.filter((order) => order.id !== orderId)
      )
    }
  } else {
    for (const [key, entry] of sellerOrdersCache) {
      if (entry.expiresAt <= Date.now()) {
        sellerOrdersCache.delete(key)
        continue
      }

      if (!entry.value.some((order) => order.id === orderId)) {
        continue
      }

      writeHybridCache(
        sellerOrdersCache,
        key,
        persistedCacheKeys.sellerOrders(key),
        entry.value.filter((order) => order.id !== orderId)
      )
    }
  }
}

export function peekCachedVendors(query = ""): VendorSnapshot[] {
  return (
    readPersistedCache<VendorSnapshot[]>(
      persistedCacheKeys.vendors(query.trim().toLowerCase())
    ) ?? []
  )
}

export function peekCachedMarketplaceSearch(
  query = ""
): MarketplaceSearchResults {
  return (
    readPersistedCache<MarketplaceSearchResults>(
      persistedCacheKeys.marketplaceSearch(query.trim().toLowerCase())
    ) ?? { products: [], vendors: [] }
  )
}

export function peekCachedProductFeed(query = ""): ProductSearchResult[] {
  return (
    readPersistedCache<ProductSearchResult[]>(
      persistedCacheKeys.productFeed(query.trim().toLowerCase())
    ) ?? []
  )
}

export function peekCachedBuyerOrders(userId: string): OrderDetail[] {
  return normalizeCachedOrderList(
    readPersistedCache<OrderDetail[]>(persistedCacheKeys.buyerOrders(userId))
  )
}

export function peekCachedSellerOrders(userId: string): OrderDetail[] {
  return normalizeCachedOrderList(
    readPersistedCache<OrderDetail[]>(persistedCacheKeys.sellerOrders(userId))
  )
}

export function peekCachedVendorDetail(vendorId: string): VendorDetail | null {
  return normalizeCachedVendorDetail(
    readPersistedCache<VendorDetail>(persistedCacheKeys.vendorDetail(vendorId))
  )
}

export async function loadVendors(query = ""): Promise<VendorSnapshot[]> {
  if (!hasSupabase) {
    return canUseDemoMode ? getVendorSnapshots(query) : []
  }

  const cacheKey = query.trim().toLowerCase()
  const cached = readHybridCache(
    vendorListCache,
    cacheKey,
    persistedCacheKeys.vendors(cacheKey)
  )
  if (cached) {
    return cached
  }

  return deduplicatedFetch(`vendors:${cacheKey}`, async () => {
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

    const { data, error } = await request.limit(60)
    if (error || !data) {
      return canUseDemoMode ? getVendorSnapshots(query) : []
    }

    return writeHybridCache(
      vendorListCache,
      cacheKey,
      persistedCacheKeys.vendors(cacheKey),
      data.map((row) => ({
        ...mapVendor(row),
        reviewCount: 0,
        productCount: 0
      }))
    )
  })
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
  const cacheKey = normalized.toLowerCase()
  const cached = readHybridCache(
    marketplaceSearchCache,
    cacheKey,
    persistedCacheKeys.marketplaceSearch(cacheKey)
  )
  if (cached) {
    return cached
  }

  return deduplicatedFetch(`marketplace-search:${cacheKey}`, async () => {

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

  return writeHybridCache(
    marketplaceSearchCache,
    cacheKey,
    persistedCacheKeys.marketplaceSearch(cacheKey),
    {
      products,
      vendors
    }
  )
  })
}

export async function loadProductFeed(query = ""): Promise<ProductSearchResult[]> {
  const normalized = query.trim()

  if (!hasSupabase) {
    return canUseDemoMode ? getProductFeed(query) : []
  }

  const cacheKey = normalized.toLowerCase()
  const cached = readHybridCache(
    productFeedCache,
    cacheKey,
    persistedCacheKeys.productFeed(cacheKey)
  )
  if (cached) {
    return cached
  }

  return deduplicatedFetch(`product-feed:${cacheKey}`, async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return canUseDemoMode ? getProductFeed(query) : []

    if (normalized) {
      const results = await loadMarketplaceSearch(query)
      return writeHybridCache(
        productFeedCache,
        cacheKey,
        persistedCacheKeys.productFeed(cacheKey),
        results.products
      )
    }

    // Single query with embedded vendor join — one round-trip instead of two
    const { data: rows, error } = await supabase
      .from("products")
      .select("*, vendor_profiles!inner(*)")
      .eq("vendor_profiles.is_active", true)
      .order("created_at", { ascending: false })
      .limit(48)

    if (error || !rows) {
      // Fallback to the two-query approach when the join is unavailable
      const { data: productRows, error: productError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(48)

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
          return [vendor.id, { ...vendor, reviewCount: 0, productCount: 0 } as VendorSnapshot]
        })
      )

      return writeHybridCache(
        productFeedCache,
        cacheKey,
        persistedCacheKeys.productFeed(cacheKey),
        productRows
          .map((row): ProductSearchResult | null => {
            const vendor = vendorSnapshotMap.get(String(row.vendor_id))
            if (!vendor) return null
            return { ...mapProduct(row), vendor }
          })
          .filter((item): item is ProductSearchResult => Boolean(item))
      )
    }

    const vendorSnapshotMap = new Map(
      rows
        .filter((row) => row.vendor_profiles && typeof row.vendor_profiles === "object" && !Array.isArray(row.vendor_profiles))
        .map((row) => {
          const vendor = mapVendor(row.vendor_profiles as Record<string, unknown>)
          return [vendor.id, { ...vendor, reviewCount: 0, productCount: 0 } as VendorSnapshot]
        })
    )

    return writeHybridCache(
      productFeedCache,
      cacheKey,
      persistedCacheKeys.productFeed(cacheKey),
      rows
        .map((row): ProductSearchResult | null => {
          const vendor = vendorSnapshotMap.get(String(row.vendor_id))
          if (!vendor) return null
          return { ...mapProduct(row), vendor }
        })
        .filter((item): item is ProductSearchResult => Boolean(item))
    )
  })
}

export async function loadVendorDetail(vendorId: string): Promise<VendorDetail | null> {
  if (!hasSupabase) {
    return canUseDemoMode ? getVendorDetailDemo(vendorId) : null
  }

  const cached =
    readCache(vendorDetailCache, vendorId) ??
    normalizeCachedVendorDetail(
      readPersistedCache<VendorDetail>(persistedCacheKeys.vendorDetail(vendorId))
    )
  if (cached) {
    writeHybridCache(
      vendorDetailCache,
      vendorId,
      persistedCacheKeys.vendorDetail(vendorId),
      cached
    )
    return cached
  }

  return deduplicatedFetch(`vendor-detail:${vendorId}`, async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return canUseDemoMode ? getVendorDetailDemo(vendorId) : null

    const [{ data: vendor }, { data: products }, { data: reviews, count: reviewCount }] =
      await Promise.all([
      supabase.from("vendor_profiles").select("*").eq("id", vendorId).maybeSingle(),
      supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("*", { count: "exact" })
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .limit(5)
    ])

    if (!vendor) return null

    const mappedVendor = mapVendor(vendor)
    cacheVendorProfile(mappedVendor, mappedVendor.userId)

    return writeHybridCache(
      vendorDetailCache,
      vendorId,
      persistedCacheKeys.vendorDetail(vendorId),
      {
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
            buyerName: getReviewerDisplayName(
              review.buyer_name ? String(review.buyer_name) : undefined
            )
          })) ?? [],
        averageRating: mappedVendor.rating,
        reviewCount: reviewCount ?? reviews?.length ?? 0
      }
    )
  })
}

// ---------------------------------------------------------------------------
// ORDER LOADING — rebuilt for simplicity and reliability
//
// Design decisions:
//   • No joined queries (vendor_profiles(*)) — avoids PostgREST schema-cache
//     errors that silently return null instead of the order data.
//   • Vendor profiles are fetched in a single batch query (list) or one
//     separate query (detail) after the order rows arrive.
//   • No deduplicatedFetch wrapper — order pages are low-traffic and the
//     added complexity was causing timing issues.
//   • A short in-memory cache (CACHE_TTL_MS) is kept so rapid re-renders
//     don't hammer the DB, but it is always bypassed when fresh:true.
// ---------------------------------------------------------------------------

export async function loadBuyerOrders(
  userId: string,
  options: { fresh?: boolean } = {}
): Promise<OrderDetail[]> {
  if (!hasSupabase) {
    return canUseDemoMode ? getBuyerOrdersDemo(userId) : []
  }

  // Return in-memory or persisted cache when not forcing a refresh.
  if (!options.fresh) {
    const cached =
      readCache(buyerOrdersCache, userId) ??
      readPersistedOrderList(persistedCacheKeys.buyerOrders(userId))
    if (cached !== null) {
      writeCache(buyerOrdersCache, userId, cached)
      return cached
    }
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getBuyerOrdersDemo(userId) : []

  // 1. Fetch all visible orders for this buyer (DB filters hidden rows too).
  const { data: rows, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("buyer_id", userId)
    .is("buyer_hidden_at", null)
    .order("created_at", { ascending: false })

  if (ordersError) {
    logMarketplaceError("buyer-orders", ordersError)
    // Return stale cache on network error rather than an empty list.
    return readCache(buyerOrdersCache, userId) ?? []
  }

  if (!rows || rows.length === 0) {
    const empty: OrderDetail[] = []
    writeHybridCache(buyerOrdersCache, userId, persistedCacheKeys.buyerOrders(userId), empty)
    return empty
  }

  // 2. Fetch every unique vendor in one round-trip.
  const vendorIds = [...new Set(rows.map((r) => String(r.vendor_id)))]
  const { data: vendorRows } = await supabase
    .from("vendor_profiles")
    .select("*")
    .in("id", vendorIds)

  const vendorById = new Map<string, VendorProfile>()
  for (const v of vendorRows ?? []) {
    vendorById.set(String(v.id), mapVendor(v))
  }

  // 3. Filter locally-hidden orders and map.
  const hiddenIds = getHiddenOrderIds("buyer", userId)
  const orders = rows
    .filter((r) => !hiddenIds.has(String(r.id)))
    .map((r) => mapOrder(r, vendorById.get(String(r.vendor_id))))

  return writeHybridCache(
    buyerOrdersCache,
    userId,
    persistedCacheKeys.buyerOrders(userId),
    orders
  )
}

export async function loadSellerOrders(
  userId: string,
  options: { fresh?: boolean } = {}
): Promise<OrderDetail[]> {
  if (!hasSupabase) {
    return canUseDemoMode ? getSellerOrdersDemo(userId) : []
  }

  if (!options.fresh) {
    const cached =
      readCache(sellerOrdersCache, userId) ??
      readPersistedOrderList(persistedCacheKeys.sellerOrders(userId))
    if (cached !== null) {
      writeCache(sellerOrdersCache, userId, cached)
      return cached
    }
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getSellerOrdersDemo(userId) : []

  // 1. Resolve this user's vendor profile (needed for vendor_id filter).
  const { data: vendorRow, error: vendorError } = await supabase
    .from("vendor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (vendorError) {
    logMarketplaceError("seller-orders-vendor", vendorError)
    return readCache(sellerOrdersCache, userId) ?? []
  }

  if (!vendorRow) return []

  const vendor = mapVendor(vendorRow)

  // 2. Fetch all visible orders for this vendor store.
  const { data: rows, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("vendor_id", vendorRow.id)
    .is("seller_hidden_at", null)
    .order("created_at", { ascending: false })

  if (ordersError) {
    logMarketplaceError("seller-orders", ordersError)
    return readCache(sellerOrdersCache, userId) ?? []
  }

  if (!rows || rows.length === 0) {
    const empty: OrderDetail[] = []
    writeHybridCache(sellerOrdersCache, userId, persistedCacheKeys.sellerOrders(userId), empty)
    return empty
  }

  const hiddenIds = getHiddenOrderIds("seller", userId)
  const orders = rows
    .filter((r) => !hiddenIds.has(String(r.id)))
    .map((r) => mapOrder(r, vendor))

  return writeHybridCache(
    sellerOrdersCache,
    userId,
    persistedCacheKeys.sellerOrders(userId),
    orders
  )
}

export async function loadOrderDetail(
  orderId: string,
  options: { fresh?: boolean } = {}
): Promise<OrderDetail | null> {
  if (!hasSupabase) {
    return canUseDemoMode ? getOrderByIdDemo(orderId) : null
  }

  if (!options.fresh) {
    const cached =
      readCache(orderDetailCache, orderId) ??
      normalizeCachedOrder(
        readPersistedCache<OrderDetail>(persistedCacheKeys.orderDetail(orderId))
      )
    if (cached !== null) {
      writeCache(orderDetailCache, orderId, cached)
      return cached
    }
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) return canUseDemoMode ? getOrderByIdDemo(orderId) : null

  // 1. Fetch the order row — simple SELECT, no joins.
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle()

  if (orderError) {
    logMarketplaceError("order-detail", orderError)
    // Surface the error so the UI can show a retry instead of "not found".
    throw new Error(orderError.message)
  }

  if (!orderRow) {
    // Genuinely not found or RLS blocked — return null (not an exception).
    return null
  }

  // 2. Fetch the vendor profile in a separate query.
  const { data: vendorRow } = await supabase
    .from("vendor_profiles")
    .select("*")
    .eq("id", orderRow.vendor_id)
    .maybeSingle()

  const order = mapOrder(orderRow, vendorRow ? mapVendor(vendorRow) : undefined)

  return writeHybridCache(
    orderDetailCache,
    orderId,
    persistedCacheKeys.orderDetail(orderId),
    order
  )
}

export async function loadSellerProducts(userId: string) {
  if (!hasSupabase) {
    return canUseDemoMode ? getSellerProductsDemo(userId) : []
  }

  const cached = readHybridCache(
    sellerProductsCache,
    userId,
    persistedCacheKeys.sellerProducts(userId)
  )
  if (cached) {
    return cached
  }

  return deduplicatedFetch(`seller-products:${userId}`, async () => {
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

    return writeHybridCache(
      sellerProductsCache,
      userId,
      persistedCacheKeys.sellerProducts(userId),
      data.map((product) => mapProduct(product))
    )
  })
}

export async function loadStoreAnalytics(userId: string): Promise<StoreAnalytics> {
  if (!hasSupabase) {
    return canUseDemoMode
      ? getStoreAnalyticsDemo(userId)
      : { totalOrders: 0, totalRevenue: 0, averageRating: 0 }
  }

  const cached = readHybridCache(
    storeAnalyticsCache,
    userId,
    persistedCacheKeys.storeAnalytics(userId)
  )
  if (cached) {
    return cached
  }

  return deduplicatedFetch(`store-analytics:${userId}`, async () => {
    const vendor = await loadVendorProfile(userId)
    if (!vendor) {
      return { totalOrders: 0, totalRevenue: 0, averageRating: 0 }
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      return canUseDemoMode
        ? getStoreAnalyticsDemo(userId)
        : { totalOrders: 0, totalRevenue: 0, averageRating: 0 }
    }

    const { data, error } = await supabase
      .from("orders")
      .select("id, total_amount, status")
      .eq("vendor_id", vendor.id)

    if (error || !data) {
      return canUseDemoMode
        ? getStoreAnalyticsDemo(userId)
        : { totalOrders: 0, totalRevenue: 0, averageRating: vendor.rating }
    }

    return writeHybridCache(
      storeAnalyticsCache,
      userId,
      persistedCacheKeys.storeAnalytics(userId),
      {
        totalOrders: data.length,
        totalRevenue: data
          .filter((order) => String(order.status) !== "cancelled")
          .reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0),
        averageRating: vendor.rating
      }
    )
  })
}

export async function loadVendorProfile(userId: string) {
  if (!hasSupabase) {
    return canUseDemoMode ? getVendorByUserId(userId) : null
  }

  const cached = readCache(vendorProfileCache, userId)
  if (cached !== null) {
    return cached
  }

  const persisted = normalizeCachedVendor(
    readPersistedCache<VendorProfile>(persistedCacheKeys.vendorProfile(userId))
  )
  if (persisted) {
    return cacheVendorProfile(persisted, userId)
  }

  return deduplicatedFetch(`vendor-profile:${userId}`, async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return canUseDemoMode ? getVendorByUserId(userId) : null
    const { data, error } = await supabase
      .from("vendor_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (error || !data) {
      return cacheVendorProfile(canUseDemoMode ? getVendorByUserId(userId) : null, userId)
    }
    return cacheVendorProfile(mapVendor(data), userId)
  })
}

export async function findOrCreateDemoUser(values: SignUpFormValues) {
  const existing = getDemoUserByEmail(values.email)
  if (existing) {
    return existing
  }

  const user: UserProfile = {
    id: createId("user"),
    email: values.email,
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

  const cached = readCache(userProfileCache, userId)
  if (cached !== null) {
    return cached
  }

  const persisted = normalizeCachedUser(
    readPersistedCache<UserProfile>(persistedCacheKeys.userProfile(userId))
  )
  if (persisted) {
    return cacheUserProfile(persisted, userId)
  }

  return deduplicatedFetch(`user-profile:${userId}`, async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return canUseDemoMode ? getDemoUserById(userId) : null
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (error || !data) {
      return cacheUserProfile(canUseDemoMode ? getDemoUserById(userId) : null, userId)
    }
    return cacheUserProfile(mapUser(data), userId)
  })
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
      email: input.email,
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

  return cacheUserProfile(mapUser(data), input.id)
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
      bank_name: input.bankName,
      account_name: input.accountName,
      account_number: input.accountNumber,
      payment_note: input.paymentNote,
      is_active: true
    })
    .select()
    .single()

  if (error || !data) {
    const message = error?.message?.toLowerCase() ?? ""
    if (
      message.includes("bank_name") ||
      message.includes("account_name") ||
      message.includes("account_number") ||
      message.includes("payment_note")
    ) {
      throw new Error("Run the latest Supabase seller-payment SQL patch, then try again.")
    }
    throw new Error(error?.message ?? "Unable to save seller profile")
  }

  const vendor = mapVendor(data)
  cacheVendorProfile(vendor, userId)
  vendorDetailCache.delete(vendor.id)
  sellerOrdersCache.delete(userId)
  sellerProductsCache.delete(userId)
  storeAnalyticsCache.delete(userId)
  deletePersistedCache(persistedCacheKeys.vendorDetail(vendor.id))
  deletePersistedCache(persistedCacheKeys.sellerOrders(userId))
  deletePersistedCache(persistedCacheKeys.sellerProducts(userId))
  deletePersistedCache(persistedCacheKeys.storeAnalytics(userId))
  clearMarketplaceDiscoveryCaches()
  return vendor
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

  const product = mapProduct(response.data)
  sellerProductsCache.clear()
  vendorDetailCache.delete(input.vendorId)
  clearPersistedCacheByPrefix("seller-products:")
  clearPersistedCacheByPrefix("vendor-detail:")
  clearPersistedCacheByPrefix("store-analytics:")
  clearMarketplaceDiscoveryCaches()
  return product
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
  sellerProductsCache.clear()
  vendorDetailCache.clear()
  clearPersistedCacheByPrefix("seller-products:")
  clearPersistedCacheByPrefix("vendor-detail:")
  clearPersistedCacheByPrefix("store-analytics:")
  clearMarketplaceDiscoveryCaches()
  return true
}

/** Returns the current session's access token, or null if not signed in. */
async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null
  const {
    data: { session }
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export async function placeOrder(
  payload: CheckoutPayload
): Promise<PlaceOrderResponse> {
  if (!hasSupabase) {
    if (canUseDemoMode) {
      const order = createOrderDemo({
        buyerId: payload.buyerId,
        vendorId: payload.vendorId,
        items: payload.items,
        totalAmount: payload.totalAmount,
        status: "pending",
        paymentMethod: payload.paymentMethod,
        paymentStatus:
          payload.paymentMethod === "vendor_transfer"
            ? "awaiting_seller_confirmation"
            : "pay_on_delivery",
        buyerPaymentNote: payload.buyerPaymentNote,
        deliveryAddress: payload.deliveryAddress
      })

      clearOrderCaches()
      return {
        orderId: order.id
      }
    }

    throw new Error(getOrderPlacementError())
  }

  const token = await getAccessToken()
  const response = await fetchWithRetry(
    "/api/orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    },
    { timeout: 15_000, retries: 1 }
  )

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(data?.error ?? "Unable to place order")
  }

  clearOrderCaches()
  return (await response.json()) as PlaceOrderResponse
}

export async function updateOrderStatus(
  orderId: string,
  updates: { status?: OrderStatus; paymentStatus?: PaymentStatus }
) {
  if (!hasSupabase) {
    if (canUseDemoMode) {
      return updateOrderStatusDemo(orderId, updates)
    }
    throw new Error(getLaunchConfigError("Order status updates"))
  }

  const token = await getAccessToken()
  const response = await fetchWithRetry(
    `/api/orders/${orderId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(updates)
    },
    { timeout: 12_000, retries: 1 }
  )

  if (!response.ok) {
    throw new Error("Unable to update order status")
  }

  updateCachedOrderCollections(orderId, (order) => ({
    ...order,
    ...(updates.status ? { status: updates.status } : {}),
    ...(updates.paymentStatus ? { paymentStatus: updates.paymentStatus } : {})
  }))

  return response.json()
}

export async function archiveCompletedOrder(
  orderId: string,
  actor: OrderArchiveActor,
  userId: string
) {
  if (!hasSupabase) {
    hideOrderLocally(actor, userId, orderId)
    removeOrderFromVisibleCaches(orderId, actor)
    return { ok: true, localOnly: true }
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    hideOrderLocally(actor, userId, orderId)
    removeOrderFromVisibleCaches(orderId, actor)
    return { ok: true, localOnly: true }
  }

  const { error } = await supabase.rpc("hide_completed_order", {
    target_order_id: orderId,
    actor
  })

  if (error) {
    const message = error.message.toLowerCase()
    const canFallbackLocally =
      message.includes("function") ||
      message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("buyer_hidden_at") ||
      message.includes("seller_hidden_at")

    if (!canFallbackLocally) {
      throw new Error(error.message)
    }

    hideOrderLocally(actor, userId, orderId)
    removeOrderFromVisibleCaches(orderId, actor)
    return { ok: true, localOnly: true }
  }

  hideOrderLocally(actor, userId, orderId)
  removeOrderFromVisibleCaches(orderId, actor)
  return { ok: true, localOnly: false }
}

export async function saveReview(input: {
  orderId: string
  buyerId: string
  vendorId: string
  rating: number
  comment: string
  buyerName: string
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
  let response = await supabase
    .from("reviews")
    .insert({
      order_id: input.orderId,
      buyer_id: input.buyerId,
      vendor_id: input.vendorId,
      rating: input.rating,
      comment: input.comment,
      buyer_name: input.buyerName
    })
    .select()
    .single()

  if (
    response.error?.code === "PGRST204" ||
    response.error?.message?.toLowerCase().includes("buyer_name")
  ) {
    response = await supabase
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
  }

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Unable to save review")
  }

  vendorDetailCache.delete(input.vendorId)
  storeAnalyticsCache.clear()
  deletePersistedCache(persistedCacheKeys.vendorDetail(input.vendorId))
  clearPersistedCacheByPrefix("store-analytics:")

  return response.data
}
