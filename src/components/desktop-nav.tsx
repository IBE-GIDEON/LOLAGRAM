"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FiHome, FiPackage, FiSearch, FiShoppingBag, FiUser } from "react-icons/fi"

import { BrandLogo } from "@/components/brand-logo"
import { useAuth } from "@/components/providers/auth-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar } from "@/components/ui"
import { canOpenStore } from "@/lib/feature-flags"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/", label: "Home", icon: FiHome },
  { href: "/search", label: "Search", icon: FiSearch },
  { href: "/orders", label: "Orders", icon: FiPackage }
]

/**
 * Desktop-only top bar. The phone layout keeps its bottom nav; from lg up the
 * app becomes a real wide-screen storefront instead of a stretched phone.
 */
export function DesktopNav() {
  const pathname = usePathname()
  const { profile, vendorProfile } = useAuth()
  const showStoreLink = canOpenStore({
    email: profile?.email,
    hasStore: Boolean(vendorProfile)
  })

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/70 bg-surface/85 backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-plum to-rose text-white">
            <BrandLogo className="h-[22px] w-[22px]" />
          </span>
          <span className="text-[19px] font-bold tracking-[-0.03em] text-ink">
            Glowgram
          </span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === link.href
                : pathname.startsWith(link.href)
            const Icon = link.icon

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-canvas text-ink"
                    : "text-muted hover:bg-canvas hover:text-ink"
                )}
              >
                <Icon aria-hidden="true" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />

          {profile ? (
            <>
              {showStoreLink ? (
                <Link
                  href={vendorProfile ? "/seller/products" : "/onboarding/seller"}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-rose/50 hover:text-rose"
                >
                  <FiShoppingBag aria-hidden="true" />
                  {vendorProfile ? "My store" : "Start selling"}
                </Link>
              ) : null}
              <Link
                href="/profile"
                aria-label="Open profile"
                className="rounded-full ring-2 ring-transparent transition hover:ring-rose/40"
              >
                <Avatar
                  src={profile.profilePhotoUrl}
                  alt={profile.fullName}
                  className="h-10 w-10"
                />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas"
              >
                <FiUser aria-hidden="true" />
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-gradient-to-r from-plum to-rose px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-110"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
