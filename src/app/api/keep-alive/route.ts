import { NextResponse } from "next/server"

import { hasSupabase, hasSupabaseAdmin } from "@/lib/env"
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server"

// Never cached or prerendered — the point is that it actually hits Postgres.
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Keep-alive ping. Supabase Free projects pause after roughly 7 days without
 * activity, and a paused project means signup and checkout return errors until
 * someone restores it by hand.
 *
 * Called by the Vercel cron in vercel.json and, as a second independent
 * trigger, by .github/workflows/keep-alive.yml.
 *
 * Set CRON_SECRET in the environment to require a bearer token — Vercel cron
 * sends it automatically once the variable exists.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET

  if (secret) {
    const provided = request.headers.get("authorization")
    if (provided !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  if (!hasSupabase) {
    return NextResponse.json(
      { ok: false, reason: "supabase-not-configured" },
      { status: 503 }
    )
  }

  const pingedAt = new Date().toISOString()
  const admin = getSupabaseAdminClient()

  // Preferred: a real write, which counts as activity beyond any doubt.
  if (hasSupabaseAdmin && admin) {
    const { error } = await admin
      .from("keep_alive")
      .upsert({ id: 1, pinged_at: pingedAt })

    if (!error) {
      return NextResponse.json({ ok: true, mode: "write", pingedAt })
    }

    // Table missing (keep-alive.sql not run yet) — fall through to a read
    // rather than reporting a failure the cron can do nothing about.
    console.warn("keep-alive write failed, falling back to read", error.message)
  }

  // Fallback: a cheap public read. Still a query against the database.
  const publicClient = getSupabaseServerClient()
  if (!publicClient) {
    return NextResponse.json(
      { ok: false, reason: "supabase-client-unavailable" },
      { status: 503 }
    )
  }

  const { error } = await publicClient
    .from("vendor_profiles")
    .select("id")
    .limit(1)

  if (error) {
    return NextResponse.json(
      { ok: false, reason: "query-failed" },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true, mode: "read", pingedAt })
}
