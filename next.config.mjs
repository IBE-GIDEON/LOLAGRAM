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
      }
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 430, 768, 1024],
    imageSizes: [64, 96, 128, 200, 215]
  },

  async headers() {
    return [
      {
        // JS/CSS bundles — content-hashed filenames, safe to cache 1 year
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
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
        // PWA icons and other public static files
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
