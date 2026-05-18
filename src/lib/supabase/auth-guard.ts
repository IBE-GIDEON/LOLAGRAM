import { getSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Extracts and verifies the Supabase JWT from the Authorization header.
 *
 * Returns the verified user object, or null if the token is missing/invalid.
 *
 * Usage in API routes:
 *   const user = await verifyAuthToken(request)
 *   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
 */
export async function verifyAuthToken(request: Request) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.slice(7).trim()
  if (!token) return null

  const supabase = getSupabaseServerClient()
  if (!supabase) return null

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token)

  if (error || !user) return null
  return user
}
