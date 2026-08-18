"use client"

import { useEffect, useRef, useState } from "react"
import { FaWhatsapp } from "react-icons/fa"
import { FiSend, FiX } from "react-icons/fi"

import { env } from "@/lib/env"
import { loadVendors } from "@/lib/marketplace"
import { buildWhatsAppUrl } from "@/lib/whatsapp"

const GREETING = "Hi, this is Afunwa Hairline. What kind of hairs do you need today?"
const REPLY_TIME = "Typically replies within 10 minutes"

type Store = {
  name: string
  photoUrl?: string
  whatsappNumber: string
}

/**
 * WhatsApp chat widget, bottom right on every page.
 *
 * Tapping the button opens a panel in the page rather than jumping straight to
 * WhatsApp, so the greeting and the reply time are read before anyone leaves.
 * The handoff happens on send, carrying whatever was typed.
 *
 * Worth being clear: the reply does not come back here. A website cannot hold
 * a two-way WhatsApp thread without the WhatsApp Business Cloud API — this is
 * the composer, and the conversation itself continues in WhatsApp.
 */
export function FloatingWhatsApp() {
  const [store, setStore] = useState<Store | null>(() =>
    env.supportWhatsapp
      ? { name: "Afunwa", whatsappNumber: env.supportWhatsapp }
      : null
  )
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [sentAt, setSentAt] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (store) return

    let ignore = false

    // Cached by the marketplace layer: one request per cache window.
    loadVendors("")
      .then((vendors) => {
        const vendor = vendors[0]
        if (ignore || !vendor?.whatsappNumber) return
        setStore({
          name: vendor.storeName,
          photoUrl: vendor.storePhotoUrl,
          whatsappNumber: vendor.whatsappNumber
        })
      })
      .catch(() => null)

    return () => {
      ignore = true
    }
  }, [store])

  // The clock is read when the panel opens, never during render — a timestamp
  // computed on the server would not match the one the browser draws.
  useEffect(() => {
    if (!open) return

    setSentAt(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    )
    const focus = window.setTimeout(() => inputRef.current?.focus(), 220)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      window.clearTimeout(focus)
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [open])

  if (!store) return null

  const send = () => {
    const url = buildWhatsAppUrl(store.whatsappNumber, message.trim() || undefined)
    if (!url) return

    window.open(url, "_blank", "noopener,noreferrer")
    setMessage("")
    setOpen(false)
  }

  return (
    <div ref={panelRef}>
      {open ? (
        <div
          role="dialog"
          aria-label={`Chat with ${store.name} on WhatsApp`}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+150px)] right-4 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl shadow-2xl lg:bottom-24 lg:right-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
            <span className="relative shrink-0">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/15 text-sm font-bold">
                {store.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={store.photoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  store.name.slice(0, 1)
                )}
              </span>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#075E54] bg-[#25D366]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{store.name}</span>
              <span className="block truncate text-[11px] text-white/75">
                {REPLY_TIME}
              </span>
            </span>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-white/85 transition hover:bg-white/10"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          {/* Conversation */}
          <div className="bg-[#ECE5DD] px-3 py-4">
            <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
              <p className="text-[11px] font-semibold text-[#075E54]">
                {store.name}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-[#111B21]">
                {GREETING}
              </p>
              <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#667781]">
                {sentAt}
                <svg viewBox="0 0 18 12" className="h-3 w-3.5 fill-none stroke-[#53BDEB] stroke-[1.6]">
                  <path d="M1 6.5 4 9.5 10 2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 6.5 10 9.5 16 2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </p>
            </div>
          </div>

          {/* Composer */}
          <form
            className="flex items-center gap-2 bg-[#F0F0F0] px-3 py-3"
            onSubmit={(event) => {
              event.preventDefault()
              send()
            }}
          >
            <input
              ref={inputRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a message.."
              aria-label="Your message"
              className="min-w-0 flex-1 rounded-full bg-white px-4 py-2.5 text-[13px] text-[#111B21] outline-none placeholder:text-[#8696A0]"
            />
            <button
              type="submit"
              aria-label="Send on WhatsApp"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:brightness-110 active:scale-95"
            >
              <FiSend className="text-lg" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close WhatsApp chat" : "Chat with us on WhatsApp"}
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+84px)] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition hover:brightness-110 active:scale-95 lg:bottom-6 lg:right-6"
      >
        {open ? (
          <FiX className="text-[26px]" />
        ) : (
          <FaWhatsapp aria-hidden="true" className="text-[28px]" />
        )}
      </button>
    </div>
  )
}
