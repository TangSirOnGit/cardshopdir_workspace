"use client"

import { useState, useTransition, useMemo, useRef } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Loader2, ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import NumberFlow from "@number-flow/react"
import { calculateSponsorPrice, type SponsorPricingConfig } from "@/lib/sponsor-pricing"
import {
  differenceInDays,
  isBefore,
  startOfDay,
  parseISO,
  format,
  areIntervalsOverlapping,
} from "date-fns"
import type { DateRange } from "react-day-picker"

interface BookedRange {
  slot: number
  startsAt: string
  endsAt: string
}

interface PrefillData {
  name: string
  tagline: string
  websiteUrl: string
  imageUrl: string
}

interface SponsorBookingProps {
  bookedRanges: BookedRange[]
  sponsorSlotCount: number
  pricingConfig: SponsorPricingConfig
  prefill?: PrefillData
}

function countAvailableSlots(
  bookedRanges: BookedRange[],
  startDate: string,
  endDate: string,
  slotCount: number,
): number {
  let available = 0
  for (let slot = 1; slot <= slotCount; slot++) {
    const slotBooked = bookedRanges.some(
      (r) =>
        r.slot === slot &&
        areIntervalsOverlapping(
          { start: parseISO(r.startsAt), end: parseISO(r.endsAt) },
          { start: parseISO(startDate), end: parseISO(endDate) },
          { inclusive: true },
        ),
    )
    if (!slotBooked) available++
  }
  return available
}

function isFullyBooked(
  bookedRanges: BookedRange[],
  date: Date,
  slotCount: number,
): boolean {
  const d = format(date, "yyyy-MM-dd")
  let bookedSlots = 0
  for (let slot = 1; slot <= slotCount; slot++) {
    const taken = bookedRanges.some(
      (r) => r.slot === slot && r.startsAt <= d && r.endsAt >= d,
    )
    if (taken) bookedSlots++
  }
  return bookedSlots >= slotCount
}

type LogoMode = "upload" | "url"

export function SponsorBooking({ bookedRanges, sponsorSlotCount, pricingConfig, prefill }: SponsorBookingProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: startOfDay(new Date()),
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(prefill?.name ?? "")
  const [tagline, setTagline] = useState(prefill?.tagline ?? "")
  const [websiteUrl, setWebsiteUrl] = useState(prefill?.websiteUrl ?? "")

  // Logo state
  const [logoMode, setLogoMode] = useState<LogoMode>(prefill?.imageUrl ? "url" : "upload")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState(prefill?.imageUrl ?? "")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const today = startOfDay(new Date())

  const disabledMatcher = useMemo(() => {
    return (date: Date) => {
      if (isBefore(date, today)) return true
      return isFullyBooked(bookedRanges, date, sponsorSlotCount)
    }
  }, [bookedRanges, today, sponsorSlotCount])

  const days =
    dateRange?.from && dateRange?.to
      ? differenceInDays(dateRange.to, dateRange.from) + 1
      : 0

  const pricing = days > 0 ? calculateSponsorPrice(days, pricingConfig) : null

  const availableSlots =
    dateRange?.from && dateRange?.to
      ? countAvailableSlots(
          bookedRanges,
          format(dateRange.from, "yyyy-MM-dd"),
          format(dateRange.to, "yyyy-MM-dd"),
          sponsorSlotCount,
        )
      : sponsorSlotCount

  const hasLogo =
    logoMode === "upload" ? !!logoFile : logoUrl.trim().length > 0

  const isValidUrl = /^https?:\/\/.+\..+/.test(websiteUrl.trim())

  const isFormValid =
    days > 0 &&
    availableSlots > 0 &&
    name.trim() &&
    tagline.trim() &&
    isValidUrl &&
    hasLogo

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  function clearLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return null
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", logoFile)
      const res = await fetch("/api/sponsor/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Logo upload failed")
        return null
      }
      const { url } = await res.json()
      return url
    } catch {
      setError("Logo upload failed")
      return null
    } finally {
      setUploading(false)
    }
  }

  async function handlePurchase() {
    if (!dateRange?.from || !dateRange?.to || !isFormValid) return
    setError(null)

    startTransition(async () => {
      try {
        let finalImageUrl = logoUrl.trim()

        if (logoMode === "upload") {
          const uploaded = await uploadLogo()
          if (!uploaded) return
          finalImageUrl = uploaded
        }

        const res = await fetch("/api/sponsor/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: format(dateRange.from!, "yyyy-MM-dd"),
            endDate: format(dateRange.to!, "yyyy-MM-dd"),
            name: name.trim(),
            tagline: tagline.trim(),
            websiteUrl: websiteUrl.trim(),
            imageUrl: finalImageUrl,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Something went wrong")
          return
        }
        if (data.url) {
          window.location.href = data.url
        }
      } catch {
        setError("Network error. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Calendar
        mode="range"
        selected={dateRange}
        onSelect={(range) => {
          setDateRange(range)
          setError(null)
        }}
        disabled={disabledMatcher}
        numberOfMonths={2}
        className="w-full rounded-xl bg-muted/40 p-4 [&_.rdp-months]:w-full [&_.rdp-month]:flex-1"
      />

      {/* Pricing summary */}
      {days > 0 && pricing && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[14px] font-medium tabular-nums">
              <NumberFlow value={days} /> {days === 1 ? "day" : "days"}
            </p>
            {availableSlots > 0 ? (
              <span className="text-[12px] text-muted-foreground">
                {availableSlots} slot{availableSlots > 1 ? "s" : ""} available
              </span>
            ) : (
              <span className="text-[12px] text-red-600 dark:text-red-400">
                Fully booked
              </span>
            )}
            {pricing.discountPercent > 0 && (
              <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                −{Math.round(pricing.discountPercent * 100)}%
              </span>
            )}
            {pricing.discountPercent === 0 && days > 1 && (
              <span className="text-[11px] text-muted-foreground/60">
                up to 30% off at 30 days
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            {pricing.discountPercent > 0 && (
              <span className="text-[12px] text-muted-foreground line-through tabular-nums">
                ${(pricing.fullPriceCents / 100).toFixed(2)}
              </span>
            )}
            <span className="text-lg font-semibold tabular-nums">
              $
              <NumberFlow
                value={pricing.totalCents / 100}
                format={{ minimumFractionDigits: 2 }}
              />
            </span>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-500/10 px-4 py-3 text-[13px] text-red-600 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {/* Form */}
      {days > 0 && availableSlots > 0 && (
        <div className="space-y-5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Sponsor details
          </p>

          <Field label="Brand name" htmlFor="name">
            <EditorialInput
              id="name"
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </Field>

          <Field label="Tagline" htmlFor="tagline">
            <EditorialInput
              id="tagline"
              placeholder="Ship faster with our dev tools"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={200}
            />
          </Field>

          <Field label="Website URL" htmlFor="websiteUrl">
            <EditorialInput
              id="websiteUrl"
              type="url"
              placeholder="https://acme.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </Field>

          {/* Logo — upload or URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium">Logo</label>
              <button
                type="button"
                onClick={() => {
                  setLogoMode(logoMode === "upload" ? "url" : "upload")
                  clearLogo()
                  setLogoUrl("")
                }}
                className="text-[11px] text-muted-foreground transition-opacity hover:opacity-60"
              >
                {logoMode === "upload"
                  ? "Use URL instead"
                  : "Upload file instead"}
              </button>
            </div>

            {logoMode === "upload" ? (
              logoPreview ? (
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                    {logoFile?.name}
                  </span>
                  <button
                    type="button"
                    onClick={clearLogo}
                    aria-label="Remove logo"
                    className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="logo-upload"
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-[13px] text-muted-foreground transition-colors hover:border-border hover:bg-muted/50"
                >
                  <ImagePlus className="h-4 w-4 shrink-0" />
                  <span>Upload logo (JPG, PNG, WebP · max 2MB)</span>
                  <input
                    ref={fileInputRef}
                    id="logo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )
            ) : (
              <EditorialInput
                id="logoUrl"
                type="url"
                placeholder="https://acme.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            )}
          </div>

          <button
            type="button"
            onClick={handlePurchase}
            disabled={!isFormValid || isPending || uploading}
            className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            {isPending || uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Purchase now · $
                {pricing ? (pricing.totalCents / 100).toFixed(2) : "0.00"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

function EditorialInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] outline-none transition-colors placeholder:text-muted-foreground focus:bg-muted",
        className,
      )}
    />
  )
}
