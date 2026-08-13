import type { MetadataRoute } from "next"

const ICON_VERSION = "20260813-afunwa-logo"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Afunwa Hairline Global",
    short_name: "Afunwa",
    description: "Wigs, bundles and closures delivered across Nigeria",
    theme_color: "#401020",
    background_color: "#401020",
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
