const isProduction = process.env.NODE_ENV === "production"

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",

  compress: true,

  experimental: {
    // Tree-shake react-icons — only bundles the icons actually imported
    optimizePackageImports: ["react-icons", "react-icons/fi"]
  },

  images: {
    remotePatterns: [
      {
        // Supabase Storage — covers all Supabase project URLs
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**"
      },
      {
        // Supabase custom storage domains
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**"
      },
      {
        // Demo / seed catalogue imagery
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        // Editorial banner sources
        protocol: "https",
        hostname: "images.pexels.com"
      }
    ],
    formats: ["image/avif", "image/webp"],
    // 1280/1600 added for the desktop storefront — without them wide screens
    // stretch a 1024px hero across the full banner.
    deviceSizes: [390, 430, 768, 1024, 1280, 1600],
    imageSizes: [64, 96, 128, 200, 215]
  },

  async headers() {
    return [
      {
        // JS/CSS bundles — content-hashed filenames, safe to cache 1 year.
        // Dev reuses chunk names between restarts, so `immutable` there pins
        // stale bundles in the browser and edits appear not to apply.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: isProduction
              ? "public, max-age=31536000, immutable"
              : "no-store, must-revalidate"
          }
        ]
      },
      {
        // Images served through Next.js image optimizer
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800"
          }
        ]
      },
      {
        // PWA icons (192 / 512 used by manifest + splash screen)
        source: "/pwa/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000"
          }
        ]
      },
      {
        // Favicon and other public icon files
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000"
          }
        ]
      },
      {
        // Service worker must not be cached so updates deploy instantly
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate"
          },
          {
            key: "Service-Worker-Allowed",
            value: "/"
          }
        ]
      }
    ]
  }
}

export default nextConfig
