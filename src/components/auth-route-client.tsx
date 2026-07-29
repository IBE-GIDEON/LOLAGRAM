"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { AuthPanel, type AuthMode } from "@/components/auth-panel"
import { useAuth } from "@/components/providers/auth-provider"

/**
 * Standalone /login and /signup screens. Anyone who is already signed in is
 * bounced straight to where they were heading instead of seeing a login form.
 */
export function AuthRouteClient({
  mode,
  next
}: {
  mode: AuthMode
  next: string
}) {
  const router = useRouter()
  const { profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && profile) {
      router.replace(next)
    }
  }, [loading, next, profile, router])

  return (
    <div className="p-4 pb-safe-nav lg:mx-auto lg:max-w-lg lg:py-10">
      <AuthPanel defaultMode={mode} redirectTo={next} />
    </div>
  )
}
