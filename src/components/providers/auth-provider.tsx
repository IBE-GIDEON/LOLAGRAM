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

import { DEMO_OTP, DEMO_USER_KEY } from "@/lib/constants"
import { canUseDemoMode } from "@/lib/env"
import {
  findOrCreateDemoUser,
  loadUserProfile,
  loadVendorProfile
} from "@/lib/marketplace"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { type AccountType, type AuthFormValues, type AuthSessionState } from "@/lib/types"

interface AuthContextValue extends AuthSessionState {
  pendingPhone: string
  requestOtp: (values: AuthFormValues) => Promise<void>
  verifyOtp: (token: string, values: AuthFormValues) => Promise<void>
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
  const [pendingPhone, setPendingPhone] = useState("")
  const isDemoMode = canUseDemoMode

  const refreshProfile = useCallback(async (userId?: string | null) => {
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
  }, [sessionUserId])

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

      supabase.auth.onAuthStateChange(async (_, nextSession) => {
        const nextId = nextSession?.user?.id ?? null
        if (ignore) return
        setSessionUserId(nextId)
        await refreshProfile(nextId)
      })

      if (!ignore) {
        setLoading(false)
      }
    }

    bootstrap()

    return () => {
      ignore = true
    }
  }, [isDemoMode, refreshProfile])

  const requestOtp = useCallback(
    async (values: AuthFormValues) => {
      setPendingPhone(values.phone)

      if (isDemoMode) {
        toast.success(`Demo OTP sent. Use ${DEMO_OTP}.`)
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error("Supabase is not configured")
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: values.phone,
        options: {
          data: {
            full_name: values.fullName,
            account_type: values.accountType
          }
        }
      })

      if (error) {
        throw error
      }

      toast.success("OTP sent to your phone number.")
    },
    [isDemoMode]
  )

  const verifyOtp = useCallback(
    async (token: string, values: AuthFormValues) => {
      if (isDemoMode) {
        if (token !== DEMO_OTP) {
          throw new Error("Use 123456 in demo mode.")
        }

        const user = await findOrCreateDemoUser(values)
        window.localStorage.setItem(DEMO_USER_KEY, user.id)
        setSessionUserId(user.id)
        await refreshProfile(user.id)
        toast.success("Welcome to LOLAGRAM.")
        return
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error("Supabase is not configured")
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone: values.phone,
        token,
        type: "sms"
      })

      if (error || !data.user) {
        throw error ?? new Error("Unable to verify OTP")
      }

      const { error: profileError } = await supabase.from("users").upsert({
        id: data.user.id,
        phone: values.phone,
        full_name: values.fullName,
        account_type: values.accountType
      })

      if (profileError) {
        throw profileError
      }

      setSessionUserId(data.user.id)
      await refreshProfile(data.user.id)
      toast.success("Signed in successfully.")
    },
    [isDemoMode, refreshProfile]
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
      pendingPhone,
      isDemoMode,
      requestOtp,
      verifyOtp,
      signOut,
      upgradeAccountType,
      refreshProfile
    }),
    [
      isDemoMode,
      loading,
      pendingPhone,
      profile,
      refreshProfile,
      requestOtp,
      sessionUserId,
      signOut,
      upgradeAccountType,
      vendorProfile,
      verifyOtp
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
