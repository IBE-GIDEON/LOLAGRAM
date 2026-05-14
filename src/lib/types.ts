export type AccountType = "buyer" | "seller" | "both"

export type VendorCategory =
  | "cosmetics"
  | "wigs"
  | "jewellery"
  | "watches"
  | "fashion"
  | "other"

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "dispatched"
  | "delivered"
  | "cancelled"

export type OrderArchiveActor = "buyer" | "seller"
export type PaymentMethod = "pay_on_delivery" | "vendor_transfer"
export type PaymentStatus =
  | "awaiting_seller_confirmation"
  | "pay_on_delivery"
  | "awaiting_vendor_payment"
  | "paid_to_vendor"

export interface UserProfile {
  id: string
  email: string
  phone: string
  fullName: string
  profilePhotoUrl?: string
  accountType: AccountType
  createdAt: string
}

export interface VendorProfile {
  id: string
  userId: string
  storeName: string
  storePhotoUrl?: string
  bio?: string
  category: VendorCategory
  city: string
  whatsappNumber: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  paymentNote?: string
  isActive: boolean
  totalSales: number
  rating: number
  createdAt: string
}

export interface Product {
  id: string
  vendorId: string
  name: string
  description: string
  price: number
  photoUrl?: string
  photoUrls: string[]
  inStock: boolean
  createdAt: string
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  buyerId: string
  vendorId: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentReference?: string
  buyerPaymentNote?: string
  deliveryAddress: string
  createdAt: string
}

export interface Review {
  id: string
  orderId: string
  buyerId: string
  vendorId: string
  rating: number
  comment: string
  createdAt: string
}

export interface PushSubscriptionRecord {
  id: string
  userId: string
  endpoint: string
  p256dh: string
  auth: string
  createdAt: string
}

export interface VendorSnapshot extends VendorProfile {
  reviewCount: number
  productCount: number
  lastOrderAt?: string
}

export interface ProductSearchResult extends Product {
  vendor: VendorSnapshot
}

export interface MarketplaceSearchResults {
  products: ProductSearchResult[]
  vendors: VendorSnapshot[]
}

export interface VendorDetail {
  vendor: VendorProfile
  owner?: UserProfile
  products: Product[]
  reviews: ReviewWithBuyer[]
  reviewCount: number
  averageRating: number
}

export interface ReviewWithBuyer extends Review {
  buyerName: string
}

export interface OrderDetail extends Order {
  vendor?: VendorProfile
  buyer?: UserProfile
}

export interface StoreAnalytics {
  totalOrders: number
  totalRevenue: number
  averageRating: number
}

export interface DemoState {
  users: UserProfile[]
  vendors: VendorProfile[]
  products: Product[]
  orders: Order[]
  reviews: Review[]
}

export interface SignUpFormValues {
  email: string
  phone: string
  fullName: string
  password: string
  accountType: AccountType
}

export interface SignInFormValues {
  email: string
  password: string
}

export interface SellerProfileInput {
  storeName: string
  category: VendorCategory
  storePhotoUrl?: string
  bio: string
  city: string
  whatsappNumber: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  paymentNote?: string
}

export interface ProductInput {
  id?: string
  vendorId: string
  name: string
  description: string
  price: number
  photoUrl?: string
  photoUrls: string[]
  inStock: boolean
}

export interface CheckoutPayload {
  buyerId: string
  vendorId: string
  items: OrderItem[]
  totalAmount: number
  deliveryAddress: string
  paymentMethod: PaymentMethod
  buyerPaymentNote?: string
}

export interface PlaceOrderResponse {
  orderId: string
}

export interface AuthSessionState {
  sessionUserId: string | null
  profile: UserProfile | null
  vendorProfile: VendorProfile | null
  loading: boolean
  isDemoMode: boolean
}
