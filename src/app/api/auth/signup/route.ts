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
  const phone = payload.phone?.trim() ?? ""
  const fullName = payload.fullName?.trim() ?? ""
  const password = payload.password ?? ""
  const accountType = payload.accountType ?? "buyer"

  if (!email || !phone || !fullName || !password) {
    return NextResponse.json(
      { error: "Email, phone number, full name, and password are required." },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Use at least 6 characters for your password." },
      { status: 400 }
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
    return NextResponse.json(
      { error: error?.message ?? "Unable to create account." },
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
