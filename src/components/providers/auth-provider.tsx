"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react"
import toast from "react-hot-toast"

import { AUTH_SNAPSHOT_KEY, DEMO_USER_KEY } from "@/lib/constants"
import { canUseDemoMode, env } from "@/lib/env"
import {
  findOrCreateDemoUser,
  loadUserProfile,
  loadVendorProfile,
  saveUserProfile
} from "@/lib/marketplace"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  type AccountType,
  type AuthSessionState,
  type SignInFormValues,
  type SignUpFormValues
} from "@/lib/types"
import type { User } from "@supabase/supabase-js"

interface AuthContextValue extends AuthSessionState {
  signIn: (values: SignInFormValues) => Promise<void>
  signUp: (values: SignUpFormValues) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (nextPassword: string) => Promise<void>
  updateEmailAddress: (email: string) => Promise<void>
  signOut: () => Promise<void>
  upgradeAccountType: (nextType: AccountType) => Promise<void>
  refreshProfile: (userId?: string | null) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthSnapshot = Pick<
  AuthSessionState,
  "sessionUserId" | "profile" | "vendorProfile"
>

function readAuthSnapshot(): AuthSnapshot {
  if (typeof window === "undefined") {
    return {
      sessionUserId: null,
      profile: null,
      vendorProfile: null
    }
  }

  const raw = window.localStorage.getItem(AUTH_SNAPSHOT_KEY)
  if (!raw) {
    return {
      sessionUserId: null,
      profile: null,
      vendorProfile: null
    }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSnapshot>
    return {
      sessionUserId:
        typeof parsed.sessionUserId === "string" ? parsed.sessionUserId : null,
      profile: parsed.profile ?? null,
      vendorProfile: parsed.vendorProfile ?? null
    }
  } catch {
    return {
      sessionUserId: null,
      profile: null,
      vendorProfile: null
    }
  }
}

function clearAuthSnapshot() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(AUTH_SNAPSHOT_KEY)
}

function saveAuthSnapshot(snapshot: AuthSnapshot) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(AUTH_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [bootSnapshot] = useState(readAuthSnapshot)
  const [sessionUserId, setSessionUserId] = useState<string | null>(
    bootSnapshot.sessionUserId
  )
  const [profile, setProfile] = useState<AuthSessionState["profile"]>(
    bootSnapshot.profile
  )
  const [vendorProfile, setVendorProfile] =
    useState<AuthSessionState["vendorProfile"]>(bootSnapshot.vendorProfile)
  const [loading, setLoading] = useState(
    !(bootSnapshot.sessionUserId || bootSnapshot.profile || bootSnapshot.vendorProfile)
  )
  const isDemoMode = canUseDemoMode

  const refreshProfile = useCallback(
    async (userId?: string | null) => {
      const targetUserId = userId ?? sessionUserId
      if (!targetUserId) {
        setProfile(null)
        setVendorProfile(null)
        return
      }

      const [nextProfile, nextVendor] = await Promise.all([
        loadUserProfile(targetUserId),
        loadVendorProfile(targetUserId)
      ])

      setProfile(nextProfile)
      setVendorProfile(nextVendor)
    },
    [sessionUserId]
  )

  const ensureProfileForSessionUser = useCallback(
    async (user: User) => {
      const [existingProfile, nextVendor] = await Promise.all([
        loadUserProfile(user.id),
        loadVendorProfile(user.id)
      ])

      if (existingProfile) {
        setProfile(existingProfile)
        setVendorProfile(nextVendor)
        return existingProfile
      }

      const nextProfile = await saveUserProfile({
        id: user.id,
        email: user.email ?? "",
        phone: String(user.user_metadata?.phone ?? ""),
        fullName: String(
          user.user_metadata?.full_name ??
            user.email?.split("@")[0] ??
            "LOLAGRAM User"
        ),
        profilePhotoUrl:
          typeof user.user_metadata?.profile_photo_url === "string"
            ? user.user_metadata.profile_photo_url
            : undefined,
        accountType:
          (String(user.user_metadata?.account_type ?? "buyer") as AccountType) ??
          "buyer",
        createdAt: user.created_at ?? new Date().toISOString()
      })

      setProfile(nextProfile)
      setVendorProfile(nextVendor)
      return nextProfile
    },
    []
  )

  useEffect(() => {
    if (!sessionUserId && !profile && !vendorProfile) {
      clearAuthSnapshot()
      return
    }

    saveAuthSnapshot({
      sessionUserId,
      profile,
      vendorProfile
    })
  }, [profile, sessionUserId, vendorProfile])

  useEffect(() => {
    let ignore = false
    let unsubscribe: (() => void) | undefined

    async function bootstrap() {
      try {
        if (isDemoMode) {
          const storedUserId = window.localStorage.getItem(DEMO_USER_KEY)
          if (storedUserId && !ignore) {
            setSessionUserId(storedUserId)
            await refreshProfile(storedUserId)
          }
          return
        }

        const supabase = getSupabaseBrowserClient()
        if (!supabase) {
          return
        }

        const {
          data: { session }
        } = await supabase.auth.getSession()

        const nextUserId = session?.user?.id ?? null
        if (!ignore) {
          setSessionUserId(nextUserId)
        }

        if (session?.user) {
          await ensureProfileForSessionUser(session.user)
        } else if (nextUserId) {
          await refreshProfile(nextUserId)
        } else if (!ignore) {
          setProfile(null)
          setVendorProfile(null)
        }

        const { data } = supabase.auth.onAuthStateChange(async (_, nextSession) => {
          const nextId = nextSession?.user?.id ?? null
          if (ignore) return
          setSessionUserId(nextId)

          try {
            if (nextSession?.user) {
              await ensureProfileForSessionUser(nextSession.user)
            } else {
              await refreshProfile(nextId)
            }
          } catch (error) {
            console.error("Failed to refresh auth session", error)
            setProfile(null)
            setVendorProfile(null)
          }
        })

        unsubscribe = () => data.subscription.unsubscribe()
      } catch (error) {
        console.error("Failed to bootstrap auth", error)
        if (!ignore) {
          setProfile(null)
          setVendorProfile(null)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      ignore = true
      unsubscribe?.()
    }
  }, [ensureProfileForSessionUser, isDemoMode, refreshProfile])

  const signIn = useCallback(
    async (values: SignInFormValues) => {
      const normalizedEmail = values.email.trim().toLowerCase()

      if (isDemoMode) {
        const user = await findOrCreateDemoUser({
          email: normalizedEmail,
          phone: "+234",
          fullName: "Demo User",
          password: values.password,
          accountType: "buyer"
        })

        window.localStorage.setItem(DEMO_USER_KEY, user.id)
        setSessionUserId(user.id)
        await refreshProfile(user.id)
        toast.success("Signed in successfully.")
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error("Supabase is not configured")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: values.password
      })

      if (error || !data.user) {
        throw error ?? new Error("Unable to sign in")
      }

      setSessionUserId(data.user.id)
      await ensureProfileForSessionUser(data.user)
      toast.success("Welcome back.")
    },
    [ensureProfileForSessionUser, isDemoMode, refreshProfile]
  )

  const signUp = useCallback(
    async (values: SignUpFormValues) => {
      const normalizedEmail = values.email.trim().toLowerCase()

      if (isDemoMode) {
        const user = await findOrCreateDemoUser({
          ...values,
          email: normalizedEmail
        })
        window.localStorage.setItem(DEMO_USER_KEY, user.id)
        setSessionUserId(user.id)
        await refreshProfile(user.id)
        toast.success("Account created.")
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error("Supabase is not configured")
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: values.password,
        options: {
          emailRedirectTo: `${env.appUrl}/profile`,
          data: {
            full_name: values.fullName,
            account_type: values.accountType,
            phone: values.phone
          }
        }
      })

      if (error || !data.user) {
        throw error ?? new Error("Unable to create account")
      }

      await supabase.from("users").upsert({
        id: data.user.id,
        email: normalizedEmail,
        phone: values.phone,
        full_name: values.fullName,
        account_type: values.accountType
      })

      if (!data.session) {
        toast.success("Account created. Check your email to confirm it, then sign in.")
        return
      }

      setSessionUserId(data.user.id)
      await ensureProfileForSessionUser(data.user)
      toast.success("Account created.")
    },
    [ensureProfileForSessionUser, isDemoMode, refreshProfile]
  )

  const requestPasswordReset = useCallback(
    async (email: string) => {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail) {
        throw new Error("Enter your email address first.")
      }

      if (isDemoMode) {
        toast.success("Reset email sent in demo mode.")
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error("Supabase is not configured")
      }

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${env.appUrl}/reset-password`
      })

      if (error) {
        throw error
      }

      toast.success("Password reset link sent. Check your email.")
    },
    [isDemoMode]
  )

  const updatePassword = useCallback(
    async (nextPassword: string) => {
      if (isDemoMode) {
        toast.success("Password updated in demo mode.")
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error("Supabase is not configured")
      }

      const { error } = await supabase.auth.updateUser({
        password: nextPassword
      })

      if (error) {
        throw error
      }

      toast.success("Password updated.")
    },
    [isDemoMode]
  )

  const updateEmailAddress = useCallback(
    async (email: string) => {
      if (!profile) return

      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail) {
        throw new Error("Enter your email address first.")
      }

      if (isDemoMode) {
        const nextProfile = {
          ...profile,
          email: normalizedEmail
        }
        await saveUserProfile(nextProfile)
        setProfile(nextProfile)
        toast.success("Email updated in demo mode.")
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error("Supabase is not configured")
      }

      const { error } = await supabase.auth.updateUser({
        email: normalizedEmail
      })

      if (error) {
        throw error
      }

      const nextProfile = await saveUserProfile({
        ...profile,
        email: normalizedEmail
      })
      setProfile(nextProfile)
      toast.success("Email updated. Check your inbox to confirm it.")
    },
    [isDemoMode, profile]
  )

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      window.localStorage.removeItem(DEMO_USER_KEY)
      clearAuthSnapshot()
      setSessionUserId(null)
      setProfile(null)
      setVendorProfile(null)
      return
    }

    const supabase = getSupabaseBrowserClient()
    clearAuthSnapshot()
    setSessionUserId(null)
    setProfile(null)
    setVendorProfile(null)

    await supabase?.auth.signOut()
  }, [isDemoMode])

  const upgradeAccountType = useCallback(
    async (nextType: AccountType) => {
      if (!sessionUserId) return

      if (isDemoMode) {
        const nextProfile = profile
          ? { ...profile, accountType: nextType }
          : null

        if (nextProfile) {
          await saveUserProfile(nextProfile)
          setProfile(nextProfile)
        }
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) return

      const { error } = await supabase
        .from("users")
        .update({ account_type: nextType })
        .eq("id", sessionUserId)

      if (error) {
        throw error
      }

      setProfile((current) =>
        current ? { ...current, accountType: nextType } : current
      )
    },
    [isDemoMode, profile, sessionUserId]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      sessionUserId,
      profile,
      vendorProfile,
      loading,
      isDemoMode,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      updateEmailAddress,
      signOut,
      upgradeAccountType,
      refreshProfile
    }),
    [
      sessionUserId,
      profile,
      vendorProfile,
      loading,
      isDemoMode,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      updateEmailAddress,
      signOut,
      upgradeAccountType,
      refreshProfile
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return value
}
