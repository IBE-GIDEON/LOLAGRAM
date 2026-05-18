import type { MetadataRoute } from "next"

const ICON_VERSION = "20260514-pwa"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LOLAGRAM",
    short_name: "LOLAGRAM",
    description: "Your local Nigerian marketplace",
    theme_color: "#25D366",
    background_color: "#08131A",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    start_url: "/",
    scope: "/",
    icons: [
      {
        src: `/pwa/icon-192.png?v=${ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: `/pwa/icon-192.png?v=${ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: `/pwa/icon-512.png?v=${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: `/pwa/icon-512.png?v=${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  }
}
