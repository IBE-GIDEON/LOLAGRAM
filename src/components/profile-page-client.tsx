"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { FiBell, FiEdit3, FiLogOut, FiShoppingBag, FiUser } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, Badge, Button, Card, Input, SectionHeading } from "@/components/ui"
import { DEMO_OTP, VIEW_MODE_KEY } from "@/lib/constants"
import { uploadImage } from "@/lib/image"
import { loadStoreAnalytics, saveUserProfile } from "@/lib/marketplace"
import { type AccountType, type AuthFormValues, type StoreAnalytics } from "@/lib/types"

export function ProfilePageClient() {
  const {
    loading,
    profile,
    vendorProfile,
    pendingPhone,
    isDemoMode,
    requestOtp,
    verifyOtp,
    signOut,
    upgradeAccountType,
    refreshProfile
  } = useAuth()
  const [authValues, setAuthValues] = useState<AuthFormValues>({
    phone: "+234",
    fullName: "",
    accountType: "buyer"
  })
  const [otp, setOtp] = useState("")
  const [otpRequested, setOtpRequested] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [editName, setEditName] = useState("")
  const [photoPreview, setPhotoPreview] = useState("")
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null)
  const [viewMode, setViewMode] = useState<"buyer" | "seller">("buyer")

  useEffect(() => {
    if (!profile) return
    setEditName(profile.fullName)
    setPhotoPreview(profile.profilePhotoUrl ?? "")
  }, [profile])

  useEffect(() => {
    if (!profile || !vendorProfile) {
      setAnalytics(null)
      return
    }

    loadStoreAnalytics(profile.id).then(setAnalytics)
  }, [profile, vendorProfile])

  useEffect(() => {
    const saved = window.localStorage.getItem(VIEW_MODE_KEY)
    if (saved === "buyer" || saved === "seller") {
      setViewMode(saved)
    }
  }, [])

  const requestPushAccess = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported on this device.")
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      toast.error("Notification permission was not granted.")
      return
    }

    const publicKeyResponse = await fetch("/api/push/public-key")
    const { publicKey } = (await publicKeyResponse.json()) as {
      publicKey?: string
    }

    if (!publicKey) {
      toast.error("Push notifications are not configured yet.")
      return
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    })

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: profile?.id,
        subscription
      })
    })

    toast.success("Push notifications enabled.")
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted">Loading profile...</div>
  }

  if (!profile) {
    return (
      <div className="space-y-4 p-4 pb-safe-nav">
        <SectionHeading title="Profile" action={<ThemeToggle />} />
        <Card className="p-5">
          <p className="text-lg font-semibold text-ink">Phone number sign in</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Sign in with OTP to shop, sell, receive order updates, and keep your
            session available inside the PWA.
          </p>
          <div className="mt-5 space-y-3">
            <Input
              placeholder="Full name"
              value={authValues.fullName}
              onChange={(event) =>
                setAuthValues((current) => ({
                  ...current,
                  fullName: event.target.value
                }))
              }
            />
            <Input
              placeholder="Phone number"
              value={authValues.phone}
              onChange={(event) =>
                setAuthValues((current) => ({
                  ...current,
                  phone: event.target.value
                }))
              }
            />
            <div className="grid grid-cols-2 gap-3 rounded-full bg-canvas p-1">
              {(["buyer", "seller"] as AccountType[]).map((type) => (
                <button
                  key={type}
                  className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-3 text-center text-sm font-semibold transition ${
                    authValues.accountType === type
                      ? "bg-chrome text-white"
                      : "text-muted hover:bg-surface"
                  }`}
                  onClick={() =>
                    setAuthValues((current) => ({ ...current, accountType: type }))
                  }
                >
                  {type === "buyer" ? "Buyer" : "Seller"}
                </button>
              ))}
            </div>
            {otpRequested ? (
              <>
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                />
                <Button
                  className="w-full"
                  onClick={async () => {
                    await verifyOtp(otp, authValues)
                  }}
                >
                  Verify OTP
                </Button>
                {isDemoMode ? (
                  <p className="text-xs text-muted">
                    Demo mode OTP:{" "}
                    <span className="font-semibold">{DEMO_OTP}</span>
                  </p>
                ) : (
                  <p className="text-xs text-muted">Sent to {pendingPhone}</p>
                )}
              </>
            ) : (
              <Button
                className="w-full"
                onClick={async () => {
                  await requestOtp(authValues)
                  setOtpRequested(true)
                }}
              >
                Send OTP
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  const showSellerSection =
    viewMode === "seller" &&
    (profile.accountType === "seller" || profile.accountType === "both")

  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <SectionHeading title="Profile" />

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <label className="relative cursor-pointer">
            <Avatar
              src={photoPreview}
              alt={profile.fullName}
              className="h-20 w-20"
            />
            <input
              className="hidden"
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const url = await uploadImage(file, "profile-photos")
                setPhotoPreview(url)
              }}
            />
          </label>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-brand/5 text-brand">
                {profile.accountType.toUpperCase()}
              </Badge>
              <Badge>{viewMode === "buyer" ? "Buyer View" : "Seller View"}</Badge>
            </div>
            <div className="mt-3 space-y-3">
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
              <Input value={profile.phone} disabled />
              <Button
                variant="secondary"
                className="w-full"
                disabled={savingProfile}
                onClick={async () => {
                  setSavingProfile(true)
                  try {
                    await saveUserProfile({
                      ...profile,
                      fullName: editName,
                      profilePhotoUrl: photoPreview
                    })
                    await refreshProfile(profile.id)
                    toast.success("Profile updated.")
                  } finally {
                    setSavingProfile(false)
                  }
                }}
              >
                <FiEdit3 />
                Edit profile
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Appearance</p>
            <p className="mt-1 text-sm text-muted">
              Switch between light and dark mode anytime.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Notification settings</p>
            <p className="mt-1 text-sm text-muted">
              Get order alerts, confirmations, and delivery updates.
            </p>
          </div>
          <FiBell className="text-brand" />
        </div>
        <Button
          className="mt-4 w-full"
          variant="outline"
          onClick={requestPushAccess}
        >
          Enable push notifications
        </Button>
      </Card>

      {profile.accountType === "buyer" && !vendorProfile ? (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <FiShoppingBag className="text-brand" />
            <div>
              <p className="text-base font-semibold text-ink">Open My Store</p>
              <p className="mt-1 text-sm text-muted">
                Become a seller anytime without creating a new account.
              </p>
            </div>
          </div>
          <Link
            href="/onboarding/seller"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-chrome px-4 py-3 text-sm font-semibold text-white"
          >
            Start seller onboarding
          </Link>
        </Card>
      ) : null}

      {profile.accountType === "seller" || profile.accountType === "both" ? (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-ink">Switch view</p>
                <p className="mt-1 text-sm text-muted">
                  Use one account for both shopping and selling.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-1 rounded-full bg-canvas p-1">
                {(["buyer", "seller"] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-3 text-center text-sm font-semibold transition ${
                      viewMode === mode ? "bg-chrome text-white" : "text-muted"
                    }`}
                    onClick={() => {
                      setViewMode(mode)
                      window.localStorage.setItem(VIEW_MODE_KEY, mode)
                    }}
                  >
                    {mode === "buyer" ? "Buyer" : "Seller"}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {showSellerSection ? (
            <>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-ink">
                      {vendorProfile?.storeName ?? "My Store"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {vendorProfile?.bio ?? "Complete your store profile."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{vendorProfile?.category ?? "Category"}</Badge>
                      <Badge>{vendorProfile?.city ?? "City"}</Badge>
                    </div>
                  </div>
                  <FiUser className="text-brand" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    href="/onboarding/seller"
                    className="inline-flex items-center justify-center rounded-full bg-chrome px-4 py-3 text-sm font-semibold text-white"
                  >
                    Edit Store
                  </Link>
                  <Link
                    href="/seller/products"
                    className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink"
                  >
                    Manage Products
                  </Link>
                </div>
              </Card>

              <Card className="grid grid-cols-3 gap-3 p-5 text-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Orders
                  </p>
                  <p className="mt-2 text-xl font-bold text-ink">
                    {analytics?.totalOrders ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Revenue
                  </p>
                  <p className="mt-2 text-xl font-bold text-ink">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      maximumFractionDigits: 0
                    }).format(analytics?.totalRevenue ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Rating
                  </p>
                  <p className="mt-2 text-xl font-bold text-ink">
                    {(analytics?.averageRating ?? 0).toFixed(1)}
                  </p>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-5">
              <p className="text-base font-semibold text-ink">
                Buyer view is active
              </p>
              <p className="mt-2 text-sm text-muted">
                Switch back to seller view anytime to manage your store, products,
                and store orders.
              </p>
            </Card>
          )}
        </div>
      ) : null}

      <Button
        variant="secondary"
        className="w-full"
        onClick={async () => {
          if (profile.accountType === "buyer") {
            await upgradeAccountType("both")
            await refreshProfile(profile.id)
            toast.success("Your account can now shop and sell.")
          } else {
            await signOut()
          }
        }}
      >
        {profile.accountType === "buyer" ? (
          "Upgrade to Buyer + Seller"
        ) : (
          <>
            <FiLogOut />
            Logout
          </>
        )}
      </Button>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}
