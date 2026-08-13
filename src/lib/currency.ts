/**
 * Multi-currency display.
 *
 * Prices are stored and settled in NGN — vendors are paid in naira, Paystack
 * charges in naira. Everything here is a *display* conversion so a shopper in
 * London or Toronto understands the price. The naira figure stays visible
 * wherever money is committed, so nobody is surprised at checkout.
 */

export const BASE_CURRENCY = "NGN"

/**
 * Currencies offered in the switcher.
 *
 * `region` names the flag to draw. It is an ISO country code rather than an
 * emoji: emoji flags render as bare letters on Windows. XOF and XAF cover a
 * dozen countries each, so they carry no region and fall back to a globe.
 */
export const CURRENCIES: Array<{
  code: string
  name: string
  country: string
  /** ISO 3166-1 alpha-2 for the flag, or null for a multi-country zone. */
  region: string | null
}> = [
  { code: "NGN", name: "Nigerian Naira", country: "Nigeria", region: "NG" },
  { code: "USD", name: "US Dollar", country: "United States", region: "US" },
  { code: "GBP", name: "British Pound", country: "United Kingdom", region: "GB" },
  { code: "EUR", name: "Euro", country: "Euro zone", region: "EU" },
  { code: "CAD", name: "Canadian Dollar", country: "Canada", region: "CA" },
  { code: "AUD", name: "Australian Dollar", country: "Australia", region: "AU" },
  { code: "GHS", name: "Ghanaian Cedi", country: "Ghana", region: "GH" },
  { code: "KES", name: "Kenyan Shilling", country: "Kenya", region: "KE" },
  { code: "ZAR", name: "South African Rand", country: "South Africa", region: "ZA" },
  { code: "TZS", name: "Tanzanian Shilling", country: "Tanzania", region: "TZ" },
  { code: "UGX", name: "Ugandan Shilling", country: "Uganda", region: "UG" },
  { code: "RWF", name: "Rwandan Franc", country: "Rwanda", region: "RW" },
  { code: "EGP", name: "Egyptian Pound", country: "Egypt", region: "EG" },
  { code: "MAD", name: "Moroccan Dirham", country: "Morocco", region: "MA" },
  { code: "XOF", name: "West African CFA Franc", country: "West Africa", region: null },
  { code: "XAF", name: "Central African CFA Franc", country: "Central Africa", region: null },
  { code: "AED", name: "UAE Dirham", country: "United Arab Emirates", region: "AE" },
  { code: "SAR", name: "Saudi Riyal", country: "Saudi Arabia", region: "SA" },
  { code: "INR", name: "Indian Rupee", country: "India", region: "IN" },
  { code: "CNY", name: "Chinese Yuan", country: "China", region: "CN" },
  { code: "JPY", name: "Japanese Yen", country: "Japan", region: "JP" },
  { code: "BRL", name: "Brazilian Real", country: "Brazil", region: "BR" },
  { code: "MXN", name: "Mexican Peso", country: "Mexico", region: "MX" },
  { code: "TRY", name: "Turkish Lira", country: "Türkiye", region: "TR" },
  { code: "CHF", name: "Swiss Franc", country: "Switzerland", region: "CH" },
  { code: "SEK", name: "Swedish Krona", country: "Sweden", region: "SE" },
  { code: "NOK", name: "Norwegian Krone", country: "Norway", region: "NO" },
  { code: "PLN", name: "Polish Zloty", country: "Poland", region: "PL" }
]

/** Lookup for the switcher trigger, which only has a code to work from. */
export function getCurrencyMeta(code: string) {
  return CURRENCIES.find((entry) => entry.code === code) ?? CURRENCIES[0]
}

export const SUPPORTED_CURRENCY_CODES = new Set(CURRENCIES.map((c) => c.code))

/** Region (ISO 3166-1 alpha-2) to currency. Unlisted regions fall back to USD. */
const REGION_CURRENCY: Record<string, string> = {
  NG: "NGN",
  US: "USD",
  GB: "GBP",
  IE: "EUR",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  BE: "EUR",
  PT: "EUR",
  AT: "EUR",
  FI: "EUR",
  GR: "EUR",
  CA: "CAD",
  AU: "AUD",
  NZ: "AUD",
  GH: "GHS",
  KE: "KES",
  ZA: "ZAR",
  TZ: "TZS",
  UG: "UGX",
  RW: "RWF",
  EG: "EGP",
  MA: "MAD",
  SN: "XOF",
  CI: "XOF",
  BJ: "XOF",
  TG: "XOF",
  ML: "XOF",
  BF: "XOF",
  NE: "XOF",
  CM: "XAF",
  GA: "XAF",
  TD: "XAF",
  AE: "AED",
  SA: "SAR",
  IN: "INR",
  CN: "CNY",
  HK: "CNY",
  JP: "JPY",
  BR: "BRL",
  MX: "MXN",
  TR: "TRY",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "NOK",
  PL: "PLN"
}

/** Coarse timezone → region, for browsers whose language lacks a region. */
const TIMEZONE_REGION: Record<string, string> = {
  "Africa/Lagos": "NG",
  "Africa/Accra": "GH",
  "Africa/Nairobi": "KE",
  "Africa/Johannesburg": "ZA",
  "Africa/Cairo": "EG",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Kampala": "UG",
  "Africa/Kigali": "RW",
  "Africa/Casablanca": "MA",
  "Africa/Dakar": "SN",
  "Africa/Abidjan": "CI",
  "Africa/Douala": "CM",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Lisbon": "PT",
  "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Warsaw": "PL",
  "Europe/Istanbul": "TR",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Sao_Paulo": "BR",
  "America/Mexico_City": "MX",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Tokyo": "JP",
  "Australia/Sydney": "AU",
  "Pacific/Auckland": "NZ"
}

/** Best guess at the shopper's currency from their browser settings. */
export function detectCurrencyCode(locale?: string, timeZone?: string) {
  const regionFromLocale = locale?.split("-")[1]?.toUpperCase()
  if (regionFromLocale && REGION_CURRENCY[regionFromLocale]) {
    return REGION_CURRENCY[regionFromLocale]
  }

  const regionFromZone = timeZone ? TIMEZONE_REGION[timeZone] : undefined
  if (regionFromZone && REGION_CURRENCY[regionFromZone]) {
    return REGION_CURRENCY[regionFromZone]
  }

  // Unknown region: naira, because that is what the price actually is.
  return BASE_CURRENCY
}

export type Rates = Record<string, number>

/**
 * Formats an amount held in naira for display, converting when a rate exists.
 * Falls back to naira whenever a rate is missing, so a shopper never sees a
 * number produced from a guess.
 */
export function formatMoney({
  amountNgn,
  currency,
  rates,
  locale
}: {
  amountNgn: number
  currency: string
  rates?: Rates | null
  locale: string
}) {
  const safeAmount = Number.isFinite(amountNgn) ? amountNgn : 0

  if (currency === BASE_CURRENCY || !rates?.[currency]) {
    return {
      text: formatInCurrency(safeAmount, BASE_CURRENCY, locale),
      converted: false
    }
  }

  const converted = safeAmount * rates[currency]

  return {
    text: formatInCurrency(converted, currency, locale),
    converted: true
  }
}

function formatInCurrency(amount: number, currency: string, locale: string) {
  // Small totals keep their minor units; large ones are cleaner rounded.
  const fractionDigits = amount > 0 && amount < 10 ? 2 : 0

  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0
  }

  // Without narrowSymbol, a browser set to en-US prints naira as "NGN 132,000"
  // rather than "₦132,000" — Intl only reaches for the symbol when the locale
  // already uses that currency. Older Safari throws on the option, so the plain
  // format is the fallback rather than the default.
  try {
    return new Intl.NumberFormat(locale, {
      ...options,
      currencyDisplay: "narrowSymbol"
    }).format(amount)
  } catch {
    // fall through
  }

  try {
    return new Intl.NumberFormat(locale, options).format(amount)
  } catch {
    // Unknown locale or currency code — never crash a price.
    return `${currency} ${Math.round(amount).toLocaleString("en")}`
  }
}
