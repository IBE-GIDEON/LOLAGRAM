"use client"

import Link from "next/link"
import { useState } from "react"
import toast from "react-hot-toast"

import { useAuth } from "@/components/providers/auth-provider"
import { Button, Card, Input, SectionHeading } from "@/components/ui"

export function ResetPasswordClient() {
  const { loading, sessionUserId, updatePassword } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  if (loading) {
    return <div className="p-4 text-sm text-muted">Loading reset screen...</div>
  }

  const readyToReset = Boolean(sessionUserId)

  return (
    <div className="space-y-4 p-4 pb-safe-nav">
      <SectionHeading title="Reset password" />

      <Card className="space-y-4 p-5">
        <div>
          <p className="text-lg font-semibold text-ink">Choose a new password</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Open this page from the recovery email we sent you, then set a fresh
            password for your phone account.
          </p>
        </div>

        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={!readyToReset}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={!readyToReset}
        />

        <Button
          className="w-full"
          disabled={!readyToReset}
          onClick={async () => {
            if (password.length < 6) {
              toast.error("Use at least 6 characters for your password.")
              return
            }

            if (password !== confirmPassword) {
              toast.error("Passwords do not match.")
              return
            }

            try {
              await updatePassword(password)
              setPassword("")
              setConfirmPassword("")
              toast.success("Password reset complete. You can now sign in.")
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Could not reset password."
              )
            }
          }}
        >
          Save new password
        </Button>

        {!readyToReset ? (
          <p className="text-xs leading-5 text-muted">
            This screen becomes active when it is opened from your recovery email
            link. If you landed here directly, go back to{" "}
            <Link href="/profile" className="font-semibold text-brand">
              Profile
            </Link>{" "}
            and request a new reset email.
          </p>
        ) : null}
      </Card>
    </div>
  )
}
