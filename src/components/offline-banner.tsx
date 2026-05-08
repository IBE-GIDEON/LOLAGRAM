"use client"

import { useEffect, useState } from "react"
import { FiWifiOff } from "react-icons/fi"

export function OfflineBanner() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const sync = () => setOnline(window.navigator.onLine)
    sync()
    window.addEventListener("online", sync)
    window.addEventListener("offline", sync)
    return () => {
      window.removeEventListener("online", sync)
      window.removeEventListener("offline", sync)
    }
  }, [])

  if (online) return null

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-brand/25 bg-chrome px-4 py-2 text-xs font-medium text-white">
      <FiWifiOff />
      You're offline. Showing cached content where possible.
    </div>
  )
}
