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

import { DEMO_USER_KEY } from "@/lib/constants"
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<AuthSessionState["profile"]>(null)
  const [vendorProfile, setVendorProfile] =
    useState<AuthSessionState["vendorProfile"]>(null)
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    let ignore = false
    let unsubscribe: (() => void) | undefined

    async function bootstrap() {
      if (isDemoMode) {
        const storedUserId = window.localStorage.getItem(DEMO_USER_KEY)
        if (storedUserId && !ignore) {
          setSessionUserId(storedUserId)
          await refreshProfile(storedUserId)
        }
        if (!ignore) {
          setLoading(false)
        }
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      const {
        data: { session }
      } = await supabase.auth.getSession()

      const nextUserId = session?.user?.id ?? null
      if (!ignore) {
        setSessionUserId(nextUserId)
      }

      if (nextUserId) {
        await refreshProfile(nextUserId)
      }

      const { data } = supabase.auth.onAuthStateChange(async (_, nextSession) => {
        const nextId = nextSession?.user?.id ?? null
        if (ignore) return
        setSessionUserId(nextId)
        await refreshProfile(nextId)
      })

      unsubscribe = () => data.subscription.unsubscribe()

      if (!ignore) {
        setLoading(false)
      }
    }

    bootstrap()

    return () => {
      ignore = true
      unsubscribe?.()
    }
  }, [isDemoMode, refreshProfile])

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
      await refreshProfile(data.user.id)
      toast.success("Welcome back.")
    },
    [isDemoMode, refreshProfile]
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
      await refreshProfile(data.user.id)
      toast.success("Account created.")
    },
    [isDemoMode, refreshProfile]
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

      await saveUserProfile({
        ...profile,
        email: normalizedEmail
      })
      await refreshProfile(profile.id)
      toast.success("Email updated. Check your inbox to confirm it.")
    },
    [isDemoMode, profile, refreshProfile]
  )

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      window.localStorage.removeItem(DEMO_USER_KEY)
      setSessionUserId(null)
      setProfile(null)
      setVendorProfile(null)
      return
    }

    const supabase = getSupabaseBrowserClient()
    await supabase?.auth.signOut()
    setSessionUserId(null)
    setProfile(null)
    setVendorProfile(null)
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

      await refreshProfile(sessionUserId)
    },
    [isDemoMode, profile, refreshProfile, sessionUserId]
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
