export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

export const hasSupabase =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey)

export const hasSupabaseAdmin =
  hasSupabase && Boolean(env.supabaseServiceRoleKey)

export const hasPaystack =
  Boolean(env.paystackPublicKey) && Boolean(env.paystackSecretKey)

export const hasWebPush =
  Boolean(env.vapidPublicKey) && Boolean(env.vapidPrivateKey)
