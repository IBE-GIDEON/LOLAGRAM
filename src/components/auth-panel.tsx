"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { FiEye, FiEyeOff, FiLoader } from "react-icons/fi"

import { BrandLockup } from "@/components/brand-logo"
import { useAuth } from "@/components/providers/auth-provider"
import { Button, Card, Input } from "@/components/ui"
import { cn } from "@/lib/utils"

export type AuthMode = "signin" | "signup" | "forgot"

const HEADINGS: Record<AuthMode, { title: string; subtitle: string }> = {
  signin: {
    title: "Welcome back",
    subtitle: "Your cart, orders and saved stores are waiting."
  },
  signup: {
    title: "Create your account",
    subtitle: "Email and password. That is all — you can shop in seconds."
  },
  forgot: {
    title: "Reset your password",
    subtitle: "We'll email you a link to set a new one."
  }
}

/**
 * Single auth surface used by /login, /signup and the Profile tab.
 * Signup deliberately collects only email + password: name is derived from the
 * email and the phone number is asked for later, at checkout or seller setup.
 */
export function AuthPanel({
  defaultMode = "signin",
  redirectTo,
  showLinks = true
}: {
  defaultMode?: AuthMode
  /** Where to send the user after success. Omit to stay on the page. */
  redirectTo?: string
  showLinks?: boolean
}) {
  const router = useRouter()
  const { signIn, signUp, requestPasswordReset } = useAuth()
  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)

  const heading = HEADINGS[mode]

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      toast.error("Enter your email address.")
      return
    }

    if (mode !== "forgot" && password.length < 6) {
      toast.error("Use at least 6 characters for your password.")
      return
    }

    setPending(true)

    try {
      if (mode === "signup") {
        await signUp({ email: trimmedEmail, password })
      } else if (mode === "signin") {
        await signIn({ email: trimmedEmail, password })
      } else {
        await requestPasswordReset(trimmedEmail)
        setMode("signin")
        return
      }

      if (redirectTo) {
        router.replace(redirectTo)
        router.refresh()
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : mode === "signup"
            ? "Could not create your account."
            : "Could not sign you in."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="overflow-hidden border-border/60 p-0">
      <div className="bg-gradient-to-br from-plum via-plum/95 to-brand/70 px-5 pb-5 pt-6 text-white">
        <BrandLockup tone="light" className="h-9 opacity-90" />
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.02em]">
          {heading.title}
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-white/80">
          {heading.subtitle}
        </p>
      </div>

      <div className="p-5">
        <div
          role="tablist"
          aria-label="Account access"
          className="flex items-center gap-1 rounded-full bg-canvas p-1"
        >
          {(
            [
              ["signin", "Sign in"],
              ["signup", "Create account"]
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              className={cn(
                "flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition",
                mode === value
                  ? "bg-chrome text-white shadow-soft"
                  : "text-muted hover:bg-surface"
              )}
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              className="text-[12px] font-semibold text-muted"
              htmlFor="auth-email"
            >
              Email address
            </label>
            <Input
              id="auth-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint={mode === "forgot" ? "send" : "next"}
              placeholder="you@example.com"
              value={email}
              disabled={pending}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {mode !== "forgot" ? (
            <div className="space-y-1.5">
              <label
                className="text-[12px] font-semibold text-muted"
                htmlFor="auth-password"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  enterKeyHint="go"
                  placeholder={
                    mode === "signup" ? "At least 6 characters" : "Your password"
                  }
                  className="pr-12"
                  value={password}
                  disabled={pending}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted transition hover:text-ink"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={pending}>
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <FiLoader className="animate-spin" aria-hidden="true" />
                {mode === "signup"
                  ? "Creating your account..."
                  : mode === "signin"
                    ? "Signing you in..."
                    : "Sending link..."}
              </span>
            ) : mode === "signup" ? (
              "Create account"
            ) : mode === "signin" ? (
              "Sign in"
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3 text-[13px]">
          {mode === "forgot" ? (
            <button
              type="button"
              className="font-semibold text-brand"
              onClick={() => setMode("signin")}
            >
              Back to sign in
            </button>
          ) : (
            <button
              type="button"
              className="font-semibold text-muted transition hover:text-ink"
              onClick={() => setMode("forgot")}
            >
              Forgot password?
            </button>
          )}

          {showLinks ? (
            <Link href="/" className="font-semibold text-muted hover:text-ink">
              Keep browsing
            </Link>
          ) : null}
        </div>

        {mode === "signup" ? (
          <p className="mt-4 rounded-2xl bg-canvas px-4 py-3 text-[12px] leading-5 text-muted">
            No phone number needed to join. We only ask for it when you place
            your first order.
          </p>
        ) : null}
      </div>
    </Card>
  )
}
