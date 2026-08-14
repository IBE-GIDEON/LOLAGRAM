const FALLBACK_APP_URL = "https://afunwa-hairline.vercel.app"

export function getAppUrl() {
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : ""

  return (
    vercelProductionUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    FALLBACK_APP_URL
  ).replace(/\/$/, "")
}
