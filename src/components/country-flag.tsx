"use client"

import { FiGlobe } from "react-icons/fi"

import AE from "country-flag-icons/react/3x2/AE"
import AU from "country-flag-icons/react/3x2/AU"
import BR from "country-flag-icons/react/3x2/BR"
import CA from "country-flag-icons/react/3x2/CA"
import CH from "country-flag-icons/react/3x2/CH"
import CN from "country-flag-icons/react/3x2/CN"
import EG from "country-flag-icons/react/3x2/EG"
import EU from "country-flag-icons/react/3x2/EU"
import GB from "country-flag-icons/react/3x2/GB"
import GH from "country-flag-icons/react/3x2/GH"
import IN from "country-flag-icons/react/3x2/IN"
import JP from "country-flag-icons/react/3x2/JP"
import KE from "country-flag-icons/react/3x2/KE"
import MA from "country-flag-icons/react/3x2/MA"
import MX from "country-flag-icons/react/3x2/MX"
import NG from "country-flag-icons/react/3x2/NG"
import NO from "country-flag-icons/react/3x2/NO"
import PL from "country-flag-icons/react/3x2/PL"
import RW from "country-flag-icons/react/3x2/RW"
import SA from "country-flag-icons/react/3x2/SA"
import SE from "country-flag-icons/react/3x2/SE"
import TR from "country-flag-icons/react/3x2/TR"
import TZ from "country-flag-icons/react/3x2/TZ"
import UG from "country-flag-icons/react/3x2/UG"
import US from "country-flag-icons/react/3x2/US"
import ZA from "country-flag-icons/react/3x2/ZA"

import { cn } from "@/lib/utils"

/**
 * Real SVG flags rather than emoji.
 *
 * Regional-indicator emoji (🇳🇬) draw a flag on Android, iOS and macOS but plain
 * letters on Windows, because Segoe UI Emoji carries no flag glyphs — so the
 * header looked broken on a Windows desktop. These are inline SVG components:
 * same everywhere, no network request, and they still work offline.
 */
const FLAGS: Record<string, typeof NG> = {
  AE, AU, BR, CA, CH, CN, EG, EU, GB, GH, IN, JP, KE, MA,
  MX, NG, NO, PL, RW, SA, SE, TR, TZ, UG, US, ZA
}

export function CountryFlag({
  region,
  className
}: {
  /** ISO 3166-1 alpha-2, or null for a multi-country currency zone. */
  region: string | null
  className?: string
}) {
  const Flag = region ? FLAGS[region] : undefined

  if (!Flag) {
    // XOF and XAF span a dozen countries apiece — no one flag is honest.
    return (
      <FiGlobe
        aria-hidden="true"
        className={cn("h-3.5 w-5 text-muted", className)}
      />
    )
  }

  return (
    <Flag
      aria-hidden="true"
      className={cn(
        "h-3.5 w-5 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]",
        className
      )}
    />
  )
}
