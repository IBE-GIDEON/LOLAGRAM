/**
 * Multi-currency display.
 *
 * Prices are stored and settled in NGN — vendors are paid in naira and the
 * card processor charges in naira. Everything here is a *display* conversion so a shopper in
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
  { code: "AFN", name: "Afghan Afghani", country: "Afghanistan", region: "AF" },
  { code: "ALL", name: "Albanian Lek", country: "Albania", region: "AL" },
  { code: "DZD", name: "Algerian Dinar", country: "Algeria", region: "DZ" },
  { code: "AOA", name: "Angolan Kwanza", country: "Angola", region: "AO" },
  { code: "ARS", name: "Argentine Peso", country: "Argentina", region: "AR" },
  { code: "AMD", name: "Armenian Dram", country: "Armenia", region: "AM" },
  { code: "AWG", name: "Aruban Florin", country: "Aruba", region: "AW" },
  { code: "AUD", name: "Australian Dollar", country: "Australia", region: "AU" },
  { code: "AZN", name: "Azerbaijani Manat", country: "Azerbaijan", region: "AZ" },
  { code: "BSD", name: "Bahamian Dollar", country: "Bahamas", region: "BS" },
  { code: "BHD", name: "Bahraini Dinar", country: "Bahrain", region: "BH" },
  { code: "BDT", name: "Bangladeshi Taka", country: "Bangladesh", region: "BD" },
  { code: "BBD", name: "Barbadian Dollar", country: "Barbados", region: "BB" },
  { code: "BYN", name: "Belarusian Ruble", country: "Belarus", region: "BY" },
  { code: "BZD", name: "Belize Dollar", country: "Belize", region: "BZ" },
  { code: "BMD", name: "Bermudan Dollar", country: "Bermuda", region: "BM" },
  { code: "BTN", name: "Bhutanese Ngultrum", country: "Bhutan", region: "BT" },
  { code: "BOB", name: "Bolivian Boliviano", country: "Bolivia", region: "BO" },
  { code: "BAM", name: "Bosnia-Herzegovina Convertible Mark", country: "Bosnia and Herzegovina", region: "BA" },
  { code: "BWP", name: "Botswanan Pula", country: "Botswana", region: "BW" },
  { code: "BRL", name: "Brazilian Real", country: "Brazil", region: "BR" },
  { code: "BND", name: "Brunei Dollar", country: "Brunei", region: "BN" },
  { code: "BGN", name: "Bulgarian Lev", country: "Bulgaria", region: "BG" },
  { code: "BIF", name: "Burundian Franc", country: "Burundi", region: "BI" },
  { code: "KHR", name: "Cambodian Riel", country: "Cambodia", region: "KH" },
  { code: "CAD", name: "Canadian Dollar", country: "Canada", region: "CA" },
  { code: "CVE", name: "Cape Verdean Escudo", country: "Cape Verde", region: "CV" },
  { code: "XCG", name: "Caribbean guilder", country: "Caribbean", region: "CW" },
  { code: "KYD", name: "Cayman Islands Dollar", country: "Cayman Islands", region: "KY" },
  { code: "XAF", name: "Central African CFA Franc", country: "Central Africa", region: null },
  { code: "CLP", name: "Chilean Peso", country: "Chile", region: "CL" },
  { code: "CNY", name: "Chinese Yuan", country: "China", region: "CN" },
  { code: "COP", name: "Colombian Peso", country: "Colombia", region: "CO" },
  { code: "KMF", name: "Comorian Franc", country: "Comoros", region: "KM" },
  { code: "CRC", name: "Costa Rican Colón", country: "Costa Rica", region: "CR" },
  { code: "CUP", name: "Cuban Peso", country: "Cuba", region: "CU" },
  { code: "CZK", name: "Czech Koruna", country: "Czechia", region: "CZ" },
  { code: "DKK", name: "Danish Krone", country: "Denmark", region: "DK" },
  { code: "DJF", name: "Djiboutian Franc", country: "Djibouti", region: "DJ" },
  { code: "DOP", name: "Dominican Peso", country: "Dominican Republic", region: "DO" },
  { code: "CDF", name: "Congolese Franc", country: "DR Congo", region: "CD" },
  { code: "XCD", name: "East Caribbean Dollar", country: "East Caribbean", region: null },
  { code: "EGP", name: "Egyptian Pound", country: "Egypt", region: "EG" },
  { code: "ERN", name: "Eritrean Nakfa", country: "Eritrea", region: "ER" },
  { code: "SZL", name: "Swazi Lilangeni", country: "Eswatini", region: "SZ" },
  { code: "ETB", name: "Ethiopian Birr", country: "Ethiopia", region: "ET" },
  { code: "EUR", name: "Euro", country: "Euro zone", region: "EU" },
  { code: "FKP", name: "Falkland Islands Pound", country: "Falkland Islands", region: "FK" },
  { code: "FJD", name: "Fijian Dollar", country: "Fiji", region: "FJ" },
  { code: "XPF", name: "CFP Franc", country: "French Pacific", region: null },
  { code: "GMD", name: "Gambian Dalasi", country: "Gambia", region: "GM" },
  { code: "GEL", name: "Georgian Lari", country: "Georgia", region: "GE" },
  { code: "GHS", name: "Ghanaian Cedi", country: "Ghana", region: "GH" },
  { code: "GIP", name: "Gibraltar Pound", country: "Gibraltar", region: "GI" },
  { code: "GTQ", name: "Guatemalan Quetzal", country: "Guatemala", region: "GT" },
  { code: "GNF", name: "Guinean Franc", country: "Guinea", region: "GN" },
  { code: "GYD", name: "Guyanaese Dollar", country: "Guyana", region: "GY" },
  { code: "HTG", name: "Haitian Gourde", country: "Haiti", region: "HT" },
  { code: "HNL", name: "Honduran Lempira", country: "Honduras", region: "HN" },
  { code: "HKD", name: "Hong Kong Dollar", country: "Hong Kong", region: "HK" },
  { code: "HUF", name: "Hungarian Forint", country: "Hungary", region: "HU" },
  { code: "ISK", name: "Icelandic Króna", country: "Iceland", region: "IS" },
  { code: "INR", name: "Indian Rupee", country: "India", region: "IN" },
  { code: "IDR", name: "Indonesian Rupiah", country: "Indonesia", region: "ID" },
  { code: "IRR", name: "Iranian Rial", country: "Iran", region: "IR" },
  { code: "IQD", name: "Iraqi Dinar", country: "Iraq", region: "IQ" },
  { code: "ILS", name: "Israeli New Shekel", country: "Israel", region: "IL" },
  { code: "JMD", name: "Jamaican Dollar", country: "Jamaica", region: "JM" },
  { code: "JPY", name: "Japanese Yen", country: "Japan", region: "JP" },
  { code: "JOD", name: "Jordanian Dinar", country: "Jordan", region: "JO" },
  { code: "KZT", name: "Kazakhstani Tenge", country: "Kazakhstan", region: "KZ" },
  { code: "KES", name: "Kenyan Shilling", country: "Kenya", region: "KE" },
  { code: "KWD", name: "Kuwaiti Dinar", country: "Kuwait", region: "KW" },
  { code: "KGS", name: "Kyrgyz Som", country: "Kyrgyzstan", region: "KG" },
  { code: "LAK", name: "Laotian Kip", country: "Laos", region: "LA" },
  { code: "LBP", name: "Lebanese Pound", country: "Lebanon", region: "LB" },
  { code: "LSL", name: "Lesotho Loti", country: "Lesotho", region: "LS" },
  { code: "LRD", name: "Liberian Dollar", country: "Liberia", region: "LR" },
  { code: "LYD", name: "Libyan Dinar", country: "Libya", region: "LY" },
  { code: "MOP", name: "Macanese Pataca", country: "Macao", region: "MO" },
  { code: "MGA", name: "Malagasy Ariary", country: "Madagascar", region: "MG" },
  { code: "MWK", name: "Malawian Kwacha", country: "Malawi", region: "MW" },
  { code: "MYR", name: "Malaysian Ringgit", country: "Malaysia", region: "MY" },
  { code: "MVR", name: "Maldivian Rufiyaa", country: "Maldives", region: "MV" },
  { code: "MRU", name: "Mauritanian Ouguiya", country: "Mauritania", region: "MR" },
  { code: "MUR", name: "Mauritian Rupee", country: "Mauritius", region: "MU" },
  { code: "MXN", name: "Mexican Peso", country: "Mexico", region: "MX" },
  { code: "MDL", name: "Moldovan Leu", country: "Moldova", region: "MD" },
  { code: "MNT", name: "Mongolian Tugrik", country: "Mongolia", region: "MN" },
  { code: "MAD", name: "Moroccan Dirham", country: "Morocco", region: "MA" },
  { code: "MZN", name: "Mozambican Metical", country: "Mozambique", region: "MZ" },
  { code: "MMK", name: "Myanmar Kyat", country: "Myanmar", region: "MM" },
  { code: "NAD", name: "Namibian Dollar", country: "Namibia", region: "NA" },
  { code: "NPR", name: "Nepalese Rupee", country: "Nepal", region: "NP" },
  { code: "NZD", name: "New Zealand Dollar", country: "New Zealand", region: "NZ" },
  { code: "NIO", name: "Nicaraguan Córdoba", country: "Nicaragua", region: "NI" },
  { code: "NGN", name: "Nigerian Naira", country: "Nigeria", region: "NG" },
  { code: "MKD", name: "Macedonian Denar", country: "North Macedonia", region: "MK" },
  { code: "NOK", name: "Norwegian Krone", country: "Norway", region: "NO" },
  { code: "OMR", name: "Omani Rial", country: "Oman", region: "OM" },
  { code: "PKR", name: "Pakistani Rupee", country: "Pakistan", region: "PK" },
  { code: "PAB", name: "Panamanian Balboa", country: "Panama", region: "PA" },
  { code: "PGK", name: "Papua New Guinean Kina", country: "Papua New Guinea", region: "PG" },
  { code: "PYG", name: "Paraguayan Guarani", country: "Paraguay", region: "PY" },
  { code: "PEN", name: "Peruvian Sol", country: "Peru", region: "PE" },
  { code: "PHP", name: "Philippine Peso", country: "Philippines", region: "PH" },
  { code: "PLN", name: "Polish Zloty", country: "Poland", region: "PL" },
  { code: "QAR", name: "Qatari Riyal", country: "Qatar", region: "QA" },
  { code: "RON", name: "Romanian Leu", country: "Romania", region: "RO" },
  { code: "RUB", name: "Russian Ruble", country: "Russia", region: "RU" },
  { code: "RWF", name: "Rwandan Franc", country: "Rwanda", region: "RW" },
  { code: "SHP", name: "St. Helena Pound", country: "Saint Helena", region: "SH" },
  { code: "WST", name: "Samoan Tala", country: "Samoa", region: "WS" },
  { code: "STN", name: "São Tomé & Príncipe Dobra", country: "Sao Tome and Principe", region: "ST" },
  { code: "SAR", name: "Saudi Riyal", country: "Saudi Arabia", region: "SA" },
  { code: "RSD", name: "Serbian Dinar", country: "Serbia", region: "RS" },
  { code: "SCR", name: "Seychellois Rupee", country: "Seychelles", region: "SC" },
  { code: "SLE", name: "Sierra Leonean Leone", country: "Sierra Leone", region: "SL" },
  { code: "SGD", name: "Singapore Dollar", country: "Singapore", region: "SG" },
  { code: "SBD", name: "Solomon Islands Dollar", country: "Solomon Islands", region: "SB" },
  { code: "SOS", name: "Somali Shilling", country: "Somalia", region: "SO" },
  { code: "ZAR", name: "South African Rand", country: "South Africa", region: "ZA" },
  { code: "KRW", name: "South Korean Won", country: "South Korea", region: "KR" },
  { code: "SSP", name: "South Sudanese Pound", country: "South Sudan", region: "SS" },
  { code: "LKR", name: "Sri Lankan Rupee", country: "Sri Lanka", region: "LK" },
  { code: "SDG", name: "Sudanese Pound", country: "Sudan", region: "SD" },
  { code: "SRD", name: "Surinamese Dollar", country: "Suriname", region: "SR" },
  { code: "SEK", name: "Swedish Krona", country: "Sweden", region: "SE" },
  { code: "CHF", name: "Swiss Franc", country: "Switzerland", region: "CH" },
  { code: "SYP", name: "Syrian Pound", country: "Syria", region: "SY" },
  { code: "TWD", name: "New Taiwan Dollar", country: "Taiwan", region: "TW" },
  { code: "TJS", name: "Tajikistani Somoni", country: "Tajikistan", region: "TJ" },
  { code: "TZS", name: "Tanzanian Shilling", country: "Tanzania", region: "TZ" },
  { code: "THB", name: "Thai Baht", country: "Thailand", region: "TH" },
  { code: "TOP", name: "Tongan Paʻanga", country: "Tonga", region: "TO" },
  { code: "TTD", name: "Trinidad & Tobago Dollar", country: "Trinidad and Tobago", region: "TT" },
  { code: "TND", name: "Tunisian Dinar", country: "Tunisia", region: "TN" },
  { code: "TRY", name: "Turkish Lira", country: "Turkiye", region: "TR" },
  { code: "TMT", name: "Turkmenistani Manat", country: "Turkmenistan", region: "TM" },
  { code: "UGX", name: "Ugandan Shilling", country: "Uganda", region: "UG" },
  { code: "UAH", name: "Ukrainian Hryvnia", country: "Ukraine", region: "UA" },
  { code: "AED", name: "United Arab Emirates Dirham", country: "United Arab Emirates", region: "AE" },
  { code: "GBP", name: "British Pound", country: "United Kingdom", region: "GB" },
  { code: "USD", name: "US Dollar", country: "United States", region: "US" },
  { code: "UYU", name: "Uruguayan Peso", country: "Uruguay", region: "UY" },
  { code: "UZS", name: "Uzbekistani Som", country: "Uzbekistan", region: "UZ" },
  { code: "VUV", name: "Vanuatu Vatu", country: "Vanuatu", region: "VU" },
  { code: "VES", name: "Venezuelan Bolívar", country: "Venezuela", region: "VE" },
  { code: "VND", name: "Vietnamese Dong", country: "Vietnam", region: "VN" },
  { code: "XOF", name: "West African CFA Franc", country: "West Africa", region: null },
  { code: "YER", name: "Yemeni Rial", country: "Yemen", region: "YE" },
  { code: "ZMW", name: "Zambian Kwacha", country: "Zambia", region: "ZM" },
  { code: "ZWG", name: "Zimbabwean Gold", country: "Zimbabwe", region: "ZW" }
].sort((a, b) => a.country.localeCompare(b.country, "en"))

/** Lookup for the switcher trigger, which only has a code to work from. */
export function getCurrencyMeta(code: string) {
  // Falls back to naira explicitly, not to CURRENCIES[0]: the list is sorted
  // alphabetically, so position zero is Australia — an unknown code would have
  // rendered as an Australian flag on a Nigerian shop.
  return (
    CURRENCIES.find((entry) => entry.code === code) ??
    CURRENCIES.find((entry) => entry.code === BASE_CURRENCY) ??
    CURRENCIES[0]
  )
}

export const SUPPORTED_CURRENCY_CODES = new Set(CURRENCIES.map((c) => c.code))

/** Region (ISO 3166-1 alpha-2) to currency. Unlisted regions fall back to USD. */
const REGION_CURRENCY: Record<string, string> = {
  AE: "AED",
  AF: "AFN",
  AG: "XCD",
  AI: "XCD",
  AL: "ALL",
  AM: "AMD",
  AO: "AOA",
  AR: "ARS",
  AT: "EUR",
  AU: "AUD",
  AW: "AWG",
  AZ: "AZN",
  BA: "BAM",
  BB: "BBD",
  BD: "BDT",
  BE: "EUR",
  BF: "XOF",
  BG: "BGN",
  BH: "BHD",
  BI: "BIF",
  BJ: "XOF",
  BM: "BMD",
  BN: "BND",
  BO: "BOB",
  BR: "BRL",
  BS: "BSD",
  BT: "BTN",
  BW: "BWP",
  BY: "BYN",
  BZ: "BZD",
  CA: "CAD",
  CD: "CDF",
  CF: "XAF",
  CG: "XAF",
  CH: "CHF",
  CI: "XOF",
  CL: "CLP",
  CM: "XAF",
  CN: "CNY",
  CO: "COP",
  CR: "CRC",
  CU: "CUP",
  CV: "CVE",
  CW: "XCG",
  CY: "EUR",
  CZ: "CZK",
  DE: "EUR",
  DJ: "DJF",
  DK: "DKK",
  DM: "XCD",
  DO: "DOP",
  DZ: "DZD",
  EE: "EUR",
  EG: "EGP",
  ER: "ERN",
  ES: "EUR",
  ET: "ETB",
  FI: "EUR",
  FJ: "FJD",
  FK: "FKP",
  FR: "EUR",
  GA: "XAF",
  GB: "GBP",
  GD: "XCD",
  GE: "GEL",
  GH: "GHS",
  GI: "GIP",
  GM: "GMD",
  GN: "GNF",
  GQ: "XAF",
  GR: "EUR",
  GT: "GTQ",
  GW: "XOF",
  GY: "GYD",
  HK: "HKD",
  HN: "HNL",
  HR: "EUR",
  HT: "HTG",
  HU: "HUF",
  ID: "IDR",
  IE: "EUR",
  IL: "ILS",
  IN: "INR",
  IQ: "IQD",
  IR: "IRR",
  IS: "ISK",
  IT: "EUR",
  JM: "JMD",
  JO: "JOD",
  JP: "JPY",
  KE: "KES",
  KG: "KGS",
  KH: "KHR",
  KM: "KMF",
  KN: "XCD",
  KR: "KRW",
  KW: "KWD",
  KY: "KYD",
  KZ: "KZT",
  LA: "LAK",
  LB: "LBP",
  LC: "XCD",
  LK: "LKR",
  LR: "LRD",
  LS: "LSL",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  LY: "LYD",
  MA: "MAD",
  MD: "MDL",
  MG: "MGA",
  MK: "MKD",
  ML: "XOF",
  MM: "MMK",
  MN: "MNT",
  MO: "MOP",
  MR: "MRU",
  MS: "XCD",
  MT: "EUR",
  MU: "MUR",
  MV: "MVR",
  MW: "MWK",
  MX: "MXN",
  MY: "MYR",
  MZ: "MZN",
  NA: "NAD",
  NC: "XPF",
  NE: "XOF",
  NG: "NGN",
  NI: "NIO",
  NL: "EUR",
  NO: "NOK",
  NP: "NPR",
  NZ: "NZD",
  OM: "OMR",
  PA: "PAB",
  PE: "PEN",
  PF: "XPF",
  PG: "PGK",
  PH: "PHP",
  PK: "PKR",
  PL: "PLN",
  PT: "EUR",
  PY: "PYG",
  QA: "QAR",
  RO: "RON",
  RS: "RSD",
  RU: "RUB",
  RW: "RWF",
  SA: "SAR",
  SB: "SBD",
  SC: "SCR",
  SD: "SDG",
  SE: "SEK",
  SG: "SGD",
  SH: "SHP",
  SI: "EUR",
  SK: "EUR",
  SL: "SLE",
  SN: "XOF",
  SO: "SOS",
  SR: "SRD",
  SS: "SSP",
  ST: "STN",
  SY: "SYP",
  SZ: "SZL",
  TD: "XAF",
  TG: "XOF",
  TH: "THB",
  TJ: "TJS",
  TM: "TMT",
  TN: "TND",
  TO: "TOP",
  TR: "TRY",
  TT: "TTD",
  TW: "TWD",
  TZ: "TZS",
  UA: "UAH",
  UG: "UGX",
  US: "USD",
  UY: "UYU",
  UZ: "UZS",
  VC: "XCD",
  VE: "VES",
  VN: "VND",
  VU: "VUV",
  WF: "XPF",
  WS: "WST",
  YE: "YER",
  ZA: "ZAR",
  ZM: "ZMW",
  ZW: "ZWG"
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
