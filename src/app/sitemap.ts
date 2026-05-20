import type { MetadataRoute } from "next"

import { getAppUrl } from "@/lib/app-url"

/**
 * Static sitemap — only public pages are listed.
 * Authenticated routes (orders, profile, seller dashboard) are excluded
 * because search engines must never index them.
 *
 * Vendor store pages (/vendor/[id]) are intentionally omitted for now
 * because store IDs are UUIDs and the total count is unbounded.
 * When you want to include them, fetch all active vendor IDs from Supabase
 * here and add an entry per vendor.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl()
  const now = new Date()

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${base}/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8
    }
  ]
}
