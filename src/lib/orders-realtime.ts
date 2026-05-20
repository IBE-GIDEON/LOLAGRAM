"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type OrderChangeInput = {
  channelName: string
  filter: string
  onChange: () => void
}

export function subscribeToOrderChanges({
  channelName,
  filter,
  onChange
}: OrderChangeInput) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return () => undefined
  }

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter
      },
      onChange
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
