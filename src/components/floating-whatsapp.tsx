"use client"

import { useEffect, useState } from "react"
import { FaWhatsapp } from "react-icons/fa"

import { env } from "@/lib/env"
import { loadVendors } from "@/lib/marketplace"
import { buildWhatsAppUrl } from "@/lib/whatsapp"

const CHAT_MESSAGE = "Hi Afunwa! I saw your store and I have a question."

/**
 * Chat-to-buy button, bottom right on every page.
 *
 * The number comes from the store itself, so it starts working the moment the
 * store exists — no env var to set and no second place to keep a phone number
 * up to date. NEXT_PUBLIC_SUPPORT_WHATSAPP overrides it when support should go
 * somewhere other than the seller's own line.
 *
 * Renders nothing when there is no usable number, rather than shipping a
 * button that opens WhatsApp's "invalid number" page.
 */
export function FloatingWhatsApp() {
  const [href, setHref] = useState(() =>
    buildWhatsAppUrl(env.supportWhatsapp, CHAT_MESSAGE)
  )

  useEffect(() => {
    if (href) return // configured explicitly; no lookup needed

    let ignore = false

    // loadVendors is cached by the marketplace layer, so this is at most one
    // request per cache window rather than one per navigation.
    loadVendors("")
      .then((vendors) => {
        if (ignore) return
        const url = buildWhatsAppUrl(vendors[0]?.whatsappNumber, CHAT_MESSAGE)
        if (url) setHref(url)
      })
      .catch(() => null)

    return () => {
      ignore = true
    }
  }, [href])

  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      // Sits above the bottom nav on phones; the nav is gone from lg up.
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+84px)] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition hover:brightness-110 active:scale-95 lg:bottom-6 lg:right-6"
    >
      <FaWhatsapp aria-hidden="true" className="text-[28px]" />
    </a>
  )
}
