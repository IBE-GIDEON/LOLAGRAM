"use client"

import dynamic from "next/dynamic"

import { AuthProvider } from "@/components/providers/auth-provider"
import { CartProvider } from "@/components/providers/cart-provider"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import { ThemeProvider } from "@/components/providers/theme-provider"

// Toaster: deferred — not needed until the first toast fires
const Toaster = dynamic(
  () => import("react-hot-toast").then((m) => ({ default: m.Toaster })),
  { ssr: false }
)

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ServiceWorkerRegister />
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: "999px",
                fontSize: "14px"
              }
            }}
          />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
