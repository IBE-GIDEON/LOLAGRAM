import type { Metadata } from "next"

import { AuthRouteClient } from "@/components/auth-route-client"
import { safeInternalPath } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Create your GLOWGRAM account",
  description:
    "Join GLOWGRAM in seconds with just an email and password, then shop wigs, hair and beauty from vendors near you."
}

export default function SignUpPage({
  searchParams
}: {
  searchParams?: { next?: string }
}) {
  return (
    <AuthRouteClient mode="signup" next={safeInternalPath(searchParams?.next)} />
  )
}
