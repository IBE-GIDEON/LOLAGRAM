const STATIC_CACHE = "lolagram-static-v1"
const VENDOR_CACHE = "lolagram-vendors-v1"
const IMAGE_CACHE = "lolagram-images-v1"
const ORDER_DB = "lolagram-offline"
const ORDER_STORE = "order-intents"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(["/", "/orders", "/profile", "/search"])
    )
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  if (event.request.method !== "GET") {
    return
  }

  if (url.pathname.startsWith("/vendor/")) {
    event.respondWith(cacheFirst(event.request, VENDOR_CACHE, 10))
    return
  }

  if (
    event.request.destination === "image" ||
    url.pathname.includes("/storage/") ||
    url.pathname.includes("/_next/image")
  ) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE, 30))
    return
  }

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request))
  }
})

self.addEventListener("sync", (event) => {
  if (event.tag === "lolagram-order-sync") {
    event.waitUntil(flushOrders())
  }
})

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event)
  const title = payload.title || "LOLAGRAM"
  const options = {
    body: payload.body || "You have a new update on LOLAGRAM.",
    icon: "/pwa/icon-192.png",
    badge: "/pwa/icon-192.png",
    data: {
      url: payload.url || "/orders"
    }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || "/orders"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }

      return undefined
    })
  )
})

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    await cache.put(request, response.clone())
    await trimCache(cacheName, limit)
    return response
  } catch (error) {
    return cached || Response.error()
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    const cached = await caches.match(request)
    return cached || Response.error()
  }
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= maxItems) return
  await cache.delete(keys[0])
  await trimCache(cacheName, maxItems)
}

function openOrdersDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ORDER_DB, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(ORDER_STORE)) {
        db.createObjectStore(ORDER_STORE, { keyPath: "id", autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getQueuedOrders() {
  const db = await openOrdersDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ORDER_STORE, "readonly")
    const store = transaction.objectStore(ORDER_STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function deleteQueuedOrder(id) {
  const db = await openOrdersDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ORDER_STORE, "readwrite")
    const store = transaction.objectStore(ORDER_STORE)
    const request = store.delete(id)
    request.onsuccess = () => resolve(true)
    request.onerror = () => reject(request.error)
  })
}

async function flushOrders() {
  const entries = await getQueuedOrders()
  for (const entry of entries) {
    try {
      const response = await fetch("/api/orders/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.payload)
      })
      if (response.ok) {
        await deleteQueuedOrder(entry.id)
      }
    } catch (error) {
      return
    }
  }
}

function readPushPayload(event) {
  if (!event.data) {
    return {}
  }

  try {
    return event.data.json()
  } catch (error) {
    return {
      body: event.data.text()
    }
  }
}
