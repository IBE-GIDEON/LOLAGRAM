"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FiHome, FiPackage, FiSearch, FiUser } from "react-icons/fi"

import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Home", icon: FiHome },
  { href: "/search", label: "Search", icon: FiSearch },
  { href: "/orders", label: "Orders", icon: FiPackage },
  { href: "/profile", label: "Profile", icon: FiUser }
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky bottom-0 z-40 border-t border-border bg-surface/95 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === item.href
              : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-medium transition",
                active
                  ? "bg-chrome text-brand shadow-soft"
                  : "text-muted hover:bg-canvas"
              )}
            >
              <Icon className="mb-1 text-base" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
