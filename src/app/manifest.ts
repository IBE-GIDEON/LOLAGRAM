import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LOLAGRAM",
    short_name: "LOLAGRAM",
    theme_color: "#C0392B",
    background_color: "#FFFFFF",
    display: "standalone",
    orientation: "portrait",
    start_url: "/",
    icons: [
      {
        src: "/pwa/icon-192",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/pwa/icon-512",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  }
}
