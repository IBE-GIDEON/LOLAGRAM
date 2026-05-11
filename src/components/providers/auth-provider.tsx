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
  requestPasswordReset: (recoveryEmail: string) => Promise<void>
  updatePassword: (nextPassword: string) => Promise<void>
  saveRecoveryEmail: (recoveryEmail: string) => Promise<void>
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

      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange(async (_, nextSession) => {
        const nextId = nextSession?.user?.id ?? null
        if (ignore) return
        setSessionUserId(nextId)
        await refreshProfile(nextId)
      })

      if (!ignore) {
        setLoading(false)
      }

      return () => subscription.unsubscribe()
    }

    let cleanup: (() => void) | undefined
    bootstrap().then((unsubscribe) => {
      cleanup = unsubscribe
    })

    return () => {
      ignore = true
      cleanup?.()
    }
  }, [isDemoMode, refreshProfile])

  const signIn = useCallback(async (values: SignInFormValues) => {
    if (isDemoMode) {
      const user = await findOrCreateDemoUser({
        phone: values.phone,
        fullName: "Demo User",
        password: values.password,
        recoveryEmail: "",
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
      phone: values.phone,
      password: values.password
    })

    if (error || !data.user) {
      throw error ?? new Error("Unable to sign in")
    }

    setSessionUserId(data.user.id)
    await refreshProfile(data.user.id)
    toast.success("Welcome back.")
  }, [isDemoMode, refreshProfile])

  const signUp = useCallback(
    async (values: SignUpFormValues) => {
      const normalizedRecoveryEmail = values.recoveryEmail?.trim().toLowerCase()

      if (isDemoMode) {
        const user = await findOrCreateDemoUser({
          ...values,
          recoveryEmail: normalizedRecoveryEmail
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
        phone: values.phone,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            account_type: values.accountType
          }
        }
      })

      if (error || !data.user) {
        throw error ?? new Error("Unable to create account")
      }

      if (!data.session) {
        throw new Error(
          "Phone confirmation is still enabled in Supabase. Turn it off to use phone and password without SMS."
        )
      }

      await supabase.from("users").upsert({
        id: data.user.id,
        phone: values.phone,
        full_name: values.fullName,
        recovery_email: normalizedRecoveryEmail,
        account_type: values.accountType
      })

      if (normalizedRecoveryEmail) {
        const { error: recoveryError } = await supabase.auth.updateUser({
          email: normalizedRecoveryEmail
        })

        if (recoveryError) {
          toast.error(
            "Account created, but recovery email needs to be added again from Profile."
          )
        } else {
          toast.success("Check your email to confirm password recovery access.")
        }
      }

      setSessionUserId(data.user.id)
      await refreshProfile(data.user.id)
      toast.success("Account created.")
    },
    [isDemoMode, refreshProfile]
  )

  const requestPasswordReset = useCallback(
    async (recoveryEmail: string) => {
      const normalizedEmail = recoveryEmail.trim().toLowerCase()
      if (!normalizedEmail) {
        throw new Error("Add your recovery email first.")
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

  const saveRecoveryEmail = useCallback(
    async (recoveryEmail: string) => {
      if (!profile) return

      const normalizedEmail = recoveryEmail.trim().toLowerCase()

      if (isDemoMode) {
        const nextProfile = {
          ...profile,
          recoveryEmail: normalizedEmail || undefined
        }
        await saveUserProfile(nextProfile)
        setProfile(nextProfile)
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error("Supabase is not configured")
      }

      if (!normalizedEmail) {
        throw new Error("Add a recovery email before saving.")
      }

      const { error } = await supabase.auth.updateUser({
        email: normalizedEmail
      })

      if (error) {
        throw error
      }

      await saveUserProfile({
        ...profile,
        recoveryEmail: normalizedEmail
      })
      await refreshProfile(profile.id)
      toast.success("Recovery email saved. Check your inbox to confirm it.")
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
          window.localStorage.setItem(DEMO_USER_KEY, nextProfile.id)
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
      saveRecoveryEmail,
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
      saveRecoveryEmail,
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
