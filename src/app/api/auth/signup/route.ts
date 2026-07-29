import { NextResponse } from "next/server"

import { hasSupabase, hasSupabaseAdmin } from "@/lib/env"
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server"
import { type AccountType } from "@/lib/types"

type SignUpPayload = {
  email?: string
  password?: string
  fullName?: string
  phone?: string
  accountType?: AccountType
}

/**
 * Signup is intentionally two fields: email + password.
 * The name is derived from the email handle and the phone number is collected
 * later (checkout / seller onboarding). Nothing else may block account creation.
 */
export async function POST(request: Request) {
  const rateLimitError = checkRateLimit(getClientKey(request))
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError }, { status: 429 })
  }

  const payload = (await request.json().catch(() => ({}))) as SignUpPayload

  const email = payload.email?.trim().toLowerCase() ?? ""
  const password = payload.password ?? ""
  const phone = normalizePhone(payload.phone)
  const accountType: AccountType =
    payload.accountType === "seller" ? "seller" : "buyer"
  const fullName = payload.fullName?.trim() || deriveNameFromEmail(email)

  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter your email address and a password." },
      { status: 400 }
    )
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "That email address does not look right." },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Use at least 6 characters for your password." },
      { status: 400 }
    )
  }

  if (payload.phone && !phone) {
    return NextResponse.json(
      { error: "That phone number does not look right." },
      { status: 400 }
    )
  }

  if (!hasSupabase) {
    return NextResponse.json(
      { error: "Sign up is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    )
  }

  const admin = getSupabaseAdminClient()

  // Preferred path: the service role creates a pre-confirmed user so the buyer
  // is shopping immediately instead of waiting on a confirmation email.
  if (hasSupabaseAdmin && admin) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        account_type: accountType,
        ...(phone ? { phone } : {})
      }
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: toFriendlyAuthError(error?.message) },
        { status: isDuplicateMessage(error?.message) ? 409 : 400 }
      )
    }

    // Profile row is written with the service role so RLS can never block it.
    const { error: profileError } = await admin.from("users").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      account_type: accountType,
      ...(phone ? { phone } : {})
    })

    if (profileError) {
      // The auth user exists but has no profile — remove it so the buyer can
      // simply retry instead of being stuck in a half-created state.
      await admin.auth.admin.deleteUser(data.user.id).catch(() => undefined)

      return NextResponse.json(
        { error: toFriendlyAuthError(profileError.message) },
        { status: isDuplicateMessage(profileError.message) ? 409 : 500 }
      )
    }

    const session = await createSessionForCredentials(email, password)

    return NextResponse.json({ ok: true, userId: data.user.id, session })
  }

  // Fallback path: no service role key configured. Signup still works through
  // the public auth API instead of failing for every single user.
  const publicClient = getSupabaseServerClient()
  if (!publicClient) {
    return NextResponse.json(
      { error: "Sign up is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    )
  }

  const { data, error } = await publicClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        account_type: accountType,
        ...(phone ? { phone } : {})
      }
    }
  })

  if (error || !data.user) {
    return NextResponse.json(
      { error: toFriendlyAuthError(error?.message) },
      { status: isDuplicateMessage(error?.message) ? 409 : 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    userId: data.user.id,
    session: data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        }
      : null,
    needsEmailConfirmation: !data.session
  })
}

/**
 * Signs the new user in server-side so the browser makes one round trip and
 * never lands in an "account created but sign in failed" state.
 */
async function createSessionForCredentials(email: string, password: string) {
  const publicClient = getSupabaseServerClient()
  if (!publicClient) return null

  const { data, error } = await publicClient.auth.signInWithPassword({
    email,
    password
  })

  if (error || !data.session) return null

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  }
}

function deriveNameFromEmail(email: string) {
  const handle = email.split("@")[0]?.replace(/[._-]+/g, " ").trim()
  if (!handle) return "GLOWGRAM User"

  return handle
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/**
 * Accepts Nigerian local formats (0803..., 803..., 234...) plus any other
 * international number written in + form. Returns "" when unusable.
 */
function normalizePhone(rawPhone?: string) {
  const compact = rawPhone?.trim().replace(/[\s()-]/g, "") ?? ""

  if (!compact || compact === "+234" || compact === "+") {
    return ""
  }

  const withCountryCode = compact.startsWith("+")
    ? compact
    : compact.startsWith("234")
      ? `+${compact}`
      : compact.startsWith("0")
        ? `+234${compact.slice(1)}`
        : `+234${compact}`

  return /^\+\d{7,15}$/.test(withCountryCode) ? withCountryCode : ""
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isDuplicateMessage(message?: string | null) {
  const text = message?.toLowerCase() ?? ""
  return (
    text.includes("already registered") ||
    text.includes("already been registered") ||
    text.includes("duplicate key") ||
    text.includes("users_email_key") ||
    text.includes("users_phone_key")
  )
}

/** Never surface Postgres/Supabase internals to a buyer mid-signup. */
function toFriendlyAuthError(message?: string | null) {
  const text = message?.toLowerCase() ?? ""

  if (text.includes("users_phone_key")) {
    return "That phone number is already on another GLOWGRAM account."
  }

  if (isDuplicateMessage(message)) {
    return "This email already has a GLOWGRAM account. Sign in instead."
  }

  if (text.includes("password")) {
    return "Use at least 6 characters for your password."
  }

  if (text.includes("rate limit") || text.includes("too many")) {
    return "Too many attempts. Wait a moment and try again."
  }

  return "We could not create your account just now. Please try again."
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_ATTEMPTS = 10
const attemptsByClient = new Map<string, { count: number; resetAt: number }>()

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

/**
 * Per-instance throttle. Not a replacement for edge rate limiting, but it stops
 * a single script from farming confirmed accounts through the service role.
 */
function checkRateLimit(clientKey: string) {
  const now = Date.now()
  const entry = attemptsByClient.get(clientKey)

  if (!entry || now > entry.resetAt) {
    attemptsByClient.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    })

    if (attemptsByClient.size > 5000) {
      for (const [key, value] of attemptsByClient) {
        if (now > value.resetAt) attemptsByClient.delete(key)
      }
    }

    return null
  }

  entry.count += 1

  if (entry.count > RATE_LIMIT_MAX_ATTEMPTS) {
    return "Too many sign up attempts from this device. Try again in a minute."
  }

  return null
}
