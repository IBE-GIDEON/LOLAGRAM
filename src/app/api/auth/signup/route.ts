import { NextResponse } from "next/server"

import { hasSupabaseAdmin } from "@/lib/env"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { type AccountType } from "@/lib/types"

type SignUpPayload = {
  email?: string
  phone?: string
  fullName?: string
  password?: string
  accountType?: AccountType
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SignUpPayload
  const supabase = getSupabaseAdminClient()

  if (!hasSupabaseAdmin || !supabase) {
    return NextResponse.json(
      { error: "Supabase admin configuration is missing for direct sign up." },
      { status: 503 }
    )
  }

  const email = payload.email?.trim().toLowerCase() ?? ""
  const phone = normalizeNigerianPhone(payload.phone)
  const fullName = payload.fullName?.trim() ?? ""
  const password = payload.password ?? ""
  const accountType =
    payload.accountType === "seller" || payload.accountType === "buyer"
      ? payload.accountType
      : "buyer"

  if (!email || !phone || !fullName || !password) {
    return NextResponse.json(
      { error: "Email, phone number, full name, and password are required." },
      { status: 400 }
    )
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    )
  }

  if (!isValidNigerianPhone(phone)) {
    return NextResponse.json(
      { error: "Enter a real Nigerian phone number, for example +2348012345678." },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Use at least 6 characters for your password." },
      { status: 400 }
    )
  }

  const [{ data: existingEmail }, { data: existingPhone }] = await Promise.all([
    supabase.from("users").select("id").eq("email", email).maybeSingle(),
    supabase.from("users").select("id").eq("phone", phone).maybeSingle()
  ])

  if (existingEmail) {
    return NextResponse.json(
      { error: "This email already has a LOLAGRAM account. Sign in instead." },
      { status: 409 }
    )
  }

  if (existingPhone) {
    return NextResponse.json(
      { error: "This phone number already belongs to another LOLAGRAM account." },
      { status: 409 }
    )
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      account_type: accountType,
      phone
    }
  })

  if (error || !data.user) {
    const message = error?.message ?? "Unable to create account."
    const isTriggerFailure = message.toLowerCase().includes("database error")

    return NextResponse.json(
      {
        error: isTriggerFailure
          ? "Supabase could not create the profile. Run the latest LOLAGRAM signup repair SQL, then try again."
          : message
      },
      { status: 400 }
    )
  }

  const { error: profileError } = await supabase.from("users").upsert({
    id: data.user.id,
    email,
    phone,
    full_name: fullName,
    account_type: accountType
  })

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    userId: data.user.id
  })
}

function normalizeNigerianPhone(rawPhone?: string) {
  const compact = rawPhone?.trim().replace(/[\s()-]/g, "") ?? ""

  if (!compact || compact === "+234") {
    return ""
  }

  if (compact.startsWith("+")) {
    return compact
  }

  if (compact.startsWith("234")) {
    return `+${compact}`
  }

  if (compact.startsWith("0")) {
    return `+234${compact.slice(1)}`
  }

  return `+234${compact}`
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidNigerianPhone(phone: string) {
  return /^\+234[789][01]\d{8}$/.test(phone)
}
