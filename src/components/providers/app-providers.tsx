"use client"

import { Toaster } from "react-hot-toast"

import { AuthProvider } from "@/components/providers/auth-provider"
import { CartProvider } from "@/components/providers/cart-provider"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import { ThemeProvider } from "@/components/providers/theme-provider"

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
