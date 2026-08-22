"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import toast from "react-hot-toast"
import { FiCheck, FiChevronRight, FiMapPin, FiTruck } from "react-icons/fi"

import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"
import { useLocale } from "@/components/providers/locale-provider"
import { PlaceAutocomplete } from "@/components/place-autocomplete"
import { RemoteImage } from "@/components/remote-image"
import { Button, Card, Input, PAGE_WIDTH } from "@/components/ui"
import { PAYMENT_METHOD_META } from "@/lib/constants"
import { PAYMENT_METHODS } from "@/lib/payment-methods"
import {
  EMPTY_CHECKOUT_ADDRESS,
  addressSummary,
  normalizeAddressPhone,
  composeDeliveryAddress,
  loadSavedAddress,
  persistAddress,
  validateAddress,
  type CheckoutAddress
} from "@/lib/checkout-address"
import {
  loadVendorDetail,
  placeOrder,
  saveUserProfile,
  startCardCheckout
} from "@/lib/marketplace"
import { COUNTRIES, DEFAULT_COUNTRY_CODE } from "@/lib/countries"
import { NIGERIAN_STATES } from "@/lib/nigeria"
import { getPrimaryProductImage } from "@/lib/product-images"
import { queueOfflineOrder } from "@/lib/offline-orders"
import { type PaymentMethod, type VendorDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

type Step = 1 | 2 | 3

export function CheckoutPageClient({
  placesEnabled = false
}: {
  /** Whether GOOGLE_PLACES_API_KEY is set, resolved on the server. */
  placesEnabled?: boolean
}) {
  const router = useRouter()
  const { profile, refreshProfile } = useAuth()
  const { money } = useLocale()
  const { vendorId, items, itemCount, subtotal, clearCart } = useCart()

  const [vendorData, setVendorData] = useState<VendorDetail | null>(null)
  const [address, setAddress] = useState<CheckoutAddress>(EMPTY_CHECKOUT_ADDRESS)
  const [savedAddress, setSavedAddress] = useState<CheckoutAddress | null>(null)
  const [step, setStep] = useState<Step>(1)
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0])
  const [submitting, setSubmitting] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // A returning buyer should land on delivery, not retype an address they have
  // already given us. Their profile seeds the blank form on a first visit.
  useEffect(() => {
    const stored = loadSavedAddress()
    if (stored) {
      setAddress(stored)
      setSavedAddress(stored)
      setStep(2)
    } else if (profile) {
      const [firstName = "", ...rest] = (profile.fullName ?? "").trim().split(/\s+/)
      setAddress((current) => ({
        ...current,
        firstName: current.firstName || firstName,
        lastName: current.lastName || rest.join(" "),
        phone: current.phone || (profile.phone ?? "")
      }))
    }
    setHydrated(true)
  }, [profile])

  useEffect(() => {
    if (!vendorId) return
    loadVendorDetail(vendorId).then(setVendorData)
  }, [vendorId])

  const productMap = useMemo(
    () =>
      new Map(
        (vendorData?.products ?? []).map((product) => [product.id, product] as const)
      ),
    [vendorData?.products]
  )

  // Same rule as the cart: the price on a line is whatever the product costs
  // now, not what it cost when it was added.
  const liveSubtotal = useMemo(() => {
    if (productMap.size === 0) return subtotal
    return items.reduce((total, item) => {
      const product = productMap.get(item.productId)
      return total + (product?.price ?? item.price) * item.quantity
    }, 0)
  }, [items, productMap, subtotal])

  const vendorTransferReady = Boolean(
    vendorData?.vendor.bankName &&
      vendorData?.vendor.accountName &&
      vendorData?.vendor.accountNumber
  )

  const canConfirm = Boolean(savedAddress) && deliveryConfirmed && !submitting

  if (hydrated && (!vendorId || itemCount === 0)) {
    return (
      <div className={`${PAGE_WIDTH.content} px-4 py-16 text-center lg:px-6`}>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-ink">
          Your cart is empty
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
          Add something you like and it will show up here, ready to check out.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex rounded-full bg-chrome px-5 py-3 text-sm font-semibold text-white"
        >
          Start shopping
        </Link>
      </div>
    )
  }

  const saveAddressStep = () => {
    const problem = validateAddress(address)
    if (problem) {
      toast.error(problem)
      return
    }

    const normalized: CheckoutAddress = {
      ...address,
      phone: normalizeAddressPhone(address.phone, address.country),
      additionalPhone: address.additionalPhone.trim()
        ? normalizeAddressPhone(address.additionalPhone, address.country)
        : ""
    }

    persistAddress(normalized)
    setAddress(normalized)
    setSavedAddress(normalized)
    setStep(2)
  }

  const confirmOrder = async () => {
    if (!savedAddress) {
      toast.error("Save your delivery address first.")
      setStep(1)
      return
    }

    if (!profile) {
      toast.error("Sign in to place your order.")
      router.push("/login?next=/checkout")
      return
    }

    // The seller reaches the buyer on this number, so keep the profile in step
    // with whatever they just typed into the address form.
    if (savedAddress.phone && profile.phone?.trim() !== savedAddress.phone) {
      try {
        await saveUserProfile({ ...profile, phone: savedAddress.phone })
        await refreshProfile(profile.id)
      } catch {
        // Not worth blocking the order: the number is in the address line too.
      }
    }

    const payload = {
      buyerId: profile.id,
      vendorId: vendorId as string,
      items,
      // The server re-prices this and ignores the figure; send the live one so
      // an order sitting in the offline queue holds something honest.
      totalAmount: liveSubtotal,
      deliveryAddress: composeDeliveryAddress(savedAddress),
      paymentMethod
    }

    if (!navigator.onLine && paymentMethod === "flutterwave") {
      toast.error("Card checkout needs a connection. Pick bank transfer to queue this order.")
      return
    }

    if (!navigator.onLine) {
      await queueOfflineOrder(payload)
      clearCart()
      toast.success("Order queued. We'll sync it once you're back online.")
      router.push("/orders")
      return
    }

    setSubmitting(true)
    try {
      if (paymentMethod === "flutterwave") {
        const { checkoutUrl } = await startCardCheckout(payload)
        // Cart deliberately left alone: an abandoned card page should not cost
        // the buyer their basket.
        window.location.href = checkoutUrl
        return
      }

      const response = await placeOrder(payload)
      clearCart()
      router.push(`/order-confirmation/${response.orderId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place order.")
    } finally {
      setSubmitting(false)
    }
  }

  const summary = savedAddress ? addressSummary(savedAddress) : null

  return (
    <div className={`${PAGE_WIDTH.wide} px-4 pb-16 pt-4 lg:px-6`}>
      <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink lg:text-[32px]">
        Checkout
      </h1>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <StepCard
            index={1}
            title="Customer address"
            note="For faster and smoother delivery, use a phone number that is active on WhatsApp"
            done={Boolean(savedAddress) && step !== 1}
            onChange={savedAddress && step !== 1 ? () => setStep(1) : undefined}
          >
            {step === 1 ? (
              <AddressForm
                address={address}
                onChange={setAddress}
                onSave={saveAddressStep}
                onCancel={savedAddress ? () => setStep(2) : undefined}
                placesEnabled={placesEnabled}
              />
            ) : summary ? (
              <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
                <FiMapPin className="mt-0.5 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{summary.name}</p>
                  <p className="mt-1 break-words text-sm leading-6 text-muted">
                    {summary.detail}
                  </p>
                </div>
              </div>
            ) : null}
          </StepCard>

          <StepCard
            index={2}
            title="Delivery details"
            done={deliveryConfirmed && step !== 2}
            locked={!savedAddress}
            onChange={
              deliveryConfirmed && step !== 2 ? () => setStep(2) : undefined
            }
          >
            {step === 2 && savedAddress ? (
              <div className="space-y-4">
                {/*
                  Deliberately the plain case: one shipment, delivered to the
                  door, no fee quoted. Anything else — pickup stations, zone
                  rates, split shipments — belongs here, and has to be priced
                  server-side alongside priceCart so the figure in the summary
                  is the figure that gets charged.
                */}
                <div className="rounded-2xl border border-brand/40 bg-brand/5 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-4 border-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">Door delivery</p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {vendorData?.vendor.storeName ?? "The seller"} will confirm
                        your delivery window on WhatsApp.
                      </p>
                    </div>
                    <FiTruck className="mt-0.5 shrink-0 text-muted" />
                  </div>
                </div>

                <div className="rounded-2xl border border-border">
                  <p className="border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Shipment 1 of 1
                  </p>
                  <div className="space-y-3 p-4">
                    {items.map((item) => {
                      const product = productMap.get(item.productId)
                      return (
                        <div key={item.productId} className="flex items-center gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-canvas">
                            <RemoteImage
                              src={product ? getPrimaryProductImage(product) : null}
                              alt={item.name}
                              sizes="56px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium text-ink">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              Qty {item.quantity} ·{" "}
                              {money((product?.price ?? item.price) * item.quantity).text}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setDeliveryConfirmed(true)
                      setStep(3)
                    }}
                  >
                    Confirm delivery details
                  </Button>
                </div>
              </div>
            ) : null}
          </StepCard>

          <StepCard
            index={3}
            title="Payment method"
            locked={!deliveryConfirmed}
            done={false}
          >
            {step === 3 ? (
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const meta = PAYMENT_METHOD_META[method]
                  const needsSellerDetails =
                    method === "vendor_transfer" && !vendorTransferReady

                  return (
                    <button
                      key={method}
                      type="button"
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition",
                        paymentMethod === method
                          ? "border-brand/40 bg-brand/5"
                          : "border-border bg-surface hover:border-brand/40"
                      )}
                      onClick={() => setPaymentMethod(method)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{meta.label}</p>
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                            paymentMethod === method
                              ? "border-4 border-brand"
                              : "border border-border"
                          )}
                        />
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {needsSellerDetails
                          ? "Place the order now. The seller can share payment details after confirming."
                          : meta.helper}
                      </p>
                    </button>
                  )
                })}

                {paymentMethod === "vendor_transfer" && vendorTransferReady ? (
                  <div className="rounded-2xl border border-border bg-canvas p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      Send payment to
                    </p>
                    <dl className="mt-3 space-y-2 text-sm">
                      {(
                        [
                          ["Bank", vendorData?.vendor.bankName],
                          ["Account name", vendorData?.vendor.accountName],
                          ["Account number", vendorData?.vendor.accountNumber]
                        ] as const
                      ).map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-3"
                        >
                          <dt className="text-muted">{label}</dt>
                          <dd
                            className={
                              label === "Account number"
                                ? "select-all font-mono text-base font-bold tracking-wide text-ink"
                                : "font-semibold text-ink"
                            }
                          >
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {vendorData?.vendor.paymentNote ? (
                      <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted">
                        {vendorData.vendor.paymentNote}
                      </p>
                    ) : null}
                    {/* baseText: a naira account at a Nigerian bank takes the
                        naira figure, whatever currency the shopper browses in. */}
                    <p className="mt-3 text-xs leading-5 text-muted">
                      Transfer{" "}
                      <span className="font-semibold text-ink">
                        {money(liveSubtotal).baseText}
                      </span>
                      , then confirm the order so the seller can match it.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </StepCard>
        </div>

        <OrderSummary
          itemCount={itemCount}
          total={liveSubtotal}
          money={money}
          canConfirm={canConfirm}
          submitting={submitting}
          onConfirm={confirmOrder}
        />
      </div>
    </div>
  )
}

function StepCard({
  index,
  title,
  note,
  done = false,
  locked = false,
  onChange,
  children
}: {
  index: number
  title: string
  note?: string
  done?: boolean
  locked?: boolean
  onChange?: () => void
  children: ReactNode
}) {
  return (
    <Card className={cn("overflow-hidden p-0", locked && "opacity-60")}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
            done
              ? "bg-success text-white"
              : locked
                ? "border border-border text-muted"
                : "bg-chrome text-white"
          )}
        >
          {done ? <FiCheck aria-hidden="true" /> : index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-[0.04em] text-ink">
            {index}. {title}
          </p>
          {note ? (
            <p className="mt-1 text-xs leading-5 text-muted">{note}</p>
          ) : null}
        </div>
        {onChange ? (
          <button
            type="button"
            onClick={onChange}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-brand"
          >
            Change
            <FiChevronRight aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {children ? <div className="border-t border-border p-4">{children}</div> : null}
    </Card>
  )
}

/** Matches Input, which is a styled <input> and cannot dress a <select>. */
const selectClass =
  "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/10"

function Field({
  label,
  children
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}

function AddressForm({
  address,
  onChange,
  onSave,
  onCancel,
  placesEnabled
}: {
  address: CheckoutAddress
  onChange: (next: CheckoutAddress) => void
  onSave: () => void
  placesEnabled: boolean
  onCancel?: () => void
}) {
  const set = <K extends keyof CheckoutAddress>(key: K, value: CheckoutAddress[K]) =>
    onChange({ ...address, [key]: value })

  const isNigeria = address.country === DEFAULT_COUNTRY_CODE

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country">
          <select
            className={selectClass}
            value={address.country}
            onChange={(event) =>
              // The state list below only applies to Nigeria, so a country
              // change clears whatever state was picked for the old one.
              onChange({ ...address, country: event.target.value, region: "" })
            }
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={isNigeria ? "State" : "State or province"}>
          {placesEnabled ? (
            <PlaceAutocomplete
              value={address.region}
              onChange={(next) => set("region", next)}
              country={address.country}
              kind="region"
              placeholder={isNigeria ? "Start typing a state" : "State or province"}
            />
          ) : isNigeria ? (
            <select
              className={selectClass}
              value={address.region}
              onChange={(event) => set("region", event.target.value)}
            >
              <option value="">Choose a state</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          ) : (
            // No lookup and no built-in list for anywhere but Nigeria.
            <Input
              value={address.region}
              placeholder="State or province"
              onChange={(event) => set("region", event.target.value)}
            />
          )}
        </Field>

        <Field label="City">
          {placesEnabled ? (
            <PlaceAutocomplete
              value={address.city}
              onChange={(next) => set("city", next)}
              country={address.country}
              kind="city"
              placeholder="Start typing a city"
              // A city's suggestion carries its state, so picking one fills
              // the field above: "Calabar" arrives knowing it is Cross River.
              onSelect={(suggestion) => {
                const parentState = suggestion.secondary.split(",")[0]?.trim()
                if (!parentState) return
                onChange({ ...address, city: suggestion.text, region: parentState })
              }}
            />
          ) : (
            <Input
              value={address.city}
              placeholder={isNigeria ? "Calabar Municipal" : "City"}
              onChange={(event) => set("city", event.target.value)}
            />
          )}
        </Field>

        <Field label="First name">
          <Input
            value={address.firstName}
            autoComplete="given-name"
            onChange={(event) => set("firstName", event.target.value)}
          />
        </Field>

        <Field label="Last name">
          <Input
            value={address.lastName}
            autoComplete="family-name"
            onChange={(event) => set("lastName", event.target.value)}
          />
        </Field>

        {/* The +234 chip is Nigeria's alone. Showing it beside a Ghanaian
            number would say we are about to dial the wrong country. */}
        <Field label="Phone number">
          <div className="flex items-center gap-2">
            {isNigeria ? (
              <span className="shrink-0 rounded-2xl border border-border bg-canvas px-3 py-3 text-sm text-muted">
                +234
              </span>
            ) : null}
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={isNigeria ? "803 000 0000" : "+233 20 000 0000"}
              value={address.phone}
              onChange={(event) => set("phone", event.target.value)}
            />
          </div>
        </Field>

        <Field label="Additional phone number (optional)">
          <div className="flex items-center gap-2">
            {isNigeria ? (
              <span className="shrink-0 rounded-2xl border border-border bg-canvas px-3 py-3 text-sm text-muted">
                +234
              </span>
            ) : null}
            <Input
              type="tel"
              inputMode="tel"
              placeholder={isNigeria ? "803 000 0000" : "+233 20 000 0000"}
              value={address.additionalPhone}
              onChange={(event) => set("additionalPhone", event.target.value)}
            />
          </div>
        </Field>
      </div>

      <Field label="Delivery address">
        <Input
          value={address.address}
          autoComplete="street-address"
          placeholder="House number and street"
          onChange={(event) => set("address", event.target.value)}
        />
      </Field>

      <Field label="Landmark (optional)">
        <Input
          value={address.landmark}
          placeholder="A place nearby the rider will know"
          onChange={(event) => set("landmark", event.target.value)}
        />
      </Field>

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit">Save address</Button>
      </div>
    </form>
  )
}

function OrderSummary({
  itemCount,
  total,
  money,
  canConfirm,
  submitting,
  onConfirm
}: {
  itemCount: number
  total: number
  money: (amount: number) => { text: string }
  canConfirm: boolean
  submitting: boolean
  onConfirm: () => void
}) {
  return (
    <Card className="p-0 lg:sticky lg:top-[88px]">
      <p className="border-b border-border px-4 py-3 text-sm font-bold text-ink">
        Order summary
      </p>

      <div className="space-y-2.5 px-4 py-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">Item&apos;s total ({itemCount})</span>
          <span className="font-semibold text-ink">{money(total).text}</span>
        </div>

        {/*
          No delivery-fee row until there is a delivery fee. Showing one the
          server does not charge would quote the buyer a number they are not
          billed — the same trap as the stale cart subtotal.
        */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">Delivery fees</span>
          <span className="text-xs text-muted">Confirmed by the seller</span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="font-bold text-ink">Total</span>
          <span className="text-lg font-bold text-brand">{money(total).text}</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Button
          className="w-full"
          disabled={!canConfirm}
          onClick={onConfirm}
        >
          {submitting ? "Placing order..." : "Confirm order"}
        </Button>
        {!canConfirm && !submitting ? (
          <p className="mt-2 text-center text-xs text-muted">
            Complete the steps above to continue
          </p>
        ) : null}
      </div>
    </Card>
  )
}
