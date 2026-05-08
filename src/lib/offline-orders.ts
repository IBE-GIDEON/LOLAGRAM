"use client"

import { openDB } from "idb"

import { OFFLINE_DB_NAME, OFFLINE_ORDER_STORE } from "@/lib/constants"
import { type CheckoutPayload } from "@/lib/types"

async function getDb() {
  return openDB(OFFLINE_DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(OFFLINE_ORDER_STORE)) {
        db.createObjectStore(OFFLINE_ORDER_STORE, {
          keyPath: "id",
          autoIncrement: true
        })
      }
    }
  })
}

export async function queueOfflineOrder(payload: CheckoutPayload) {
  const db = await getDb()
  await db.add(OFFLINE_ORDER_STORE, {
    payload,
    createdAt: new Date().toISOString()
  })

  if (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "SyncManager" in window
  ) {
    const registration = await navigator.serviceWorker.ready
    const syncRegistration = registration as ServiceWorkerRegistration & {
      sync?: {
        register: (tag: string) => Promise<void>
      }
    }

    await syncRegistration.sync?.register("lolagram-order-sync")
  }
}

export async function flushOfflineOrders() {
  const db = await getDb()
  const allEntries = await db.getAll(OFFLINE_ORDER_STORE)

  for (const entry of allEntries) {
    const response = await fetch("/api/orders/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry.payload)
    })

    if (response.ok) {
      await db.delete(OFFLINE_ORDER_STORE, entry.id)
    }
  }
}
