import { createClient } from "@supabase/supabase-js"

import { env, hasSupabase, hasSupabaseAdmin } from "@/lib/env"

export function getSupabaseServerClient() {
  if (!hasSupabase) {
    return null
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

export function getSupabaseAdminClient() {
  if (!hasSupabaseAdmin) {
    return null
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}
