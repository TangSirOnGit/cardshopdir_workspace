import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sponsors } from "@/lib/db/schema"
import { and, lte, gte, eq } from "drizzle-orm"
import { getStripe } from "@/lib/stripe"
import { env } from "@/lib/env"
import { calculateSponsorPrice } from "@/lib/sponsor-pricing"
import { getSettingsTyped } from "@/lib/settings"
import { differenceInDays, parseISO, format } from "date-fns"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"
import { hasAllowedProtocol } from "@/lib/safe-url"
import { z } from "zod"
import { auth } from "@/lib/auth"
import {
  cacheFavicon,
  isSafeImageUrl,
  uploadRemoteImageToR2,
} from "@/lib/images"

/** Mirrors the sponsors column widths in lib/db/schema.ts. The date refinement
 * matters most: `parseISO` on a malformed string yields Invalid Date, every
 * subsequent comparison is NaN (so false), and the checks below all pass. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const sponsorCheckoutSchema = z.object({
  startDate: z.string().regex(ISO_DATE, "startDate must be YYYY-MM-DD"),
  endDate: z.string().regex(ISO_DATE, "endDate must be YYYY-MM-DD"),
  name: z.string().trim().min(1).max(100),
  tagline: z.string().trim().min(1).max(200),
  websiteUrl: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine(hasAllowedProtocol, "Website URL must be http(s)"),
  imageUrl: z.string().trim().max(2048).optional().nullable(),
})

async function findAvailableSlot(
  startDate: string,
  endDate: string,
  slotCount: number
) {
  for (let slot = 1; slot <= slotCount; slot++) {
    const overlapping = await db
      .select({ id: sponsors.id })
      .from(sponsors)
      .where(
        and(
          eq(sponsors.slot, slot),
          lte(sponsors.startsAt, endDate),
          gte(sponsors.endsAt, startDate)
        )
      )
      .limit(1)

    if (overlapping.length === 0) return slot
  }
  return null
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)

  const { allowed } = await rateLimit({
    key: `sponsor-checkout:${ip}`,
    limit: 10,
    windowSeconds: 3600,
  })

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = sponsorCheckoutSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking" },
      { status: 400 }
    )
  }

  const { startDate, endDate, name, tagline, websiteUrl, imageUrl } =
    parsed.data

  // Re-host any user-supplied image URL on our CDN; fall back to the
  // website's favicon, then null. Guarantees next/image never hits an
  // un-allowed host.
  let safeImageUrl: string | null = null
  if (imageUrl && isSafeImageUrl(imageUrl)) {
    safeImageUrl = imageUrl
  } else if (imageUrl && imageUrl.trim()) {
    safeImageUrl = await uploadRemoteImageToR2(imageUrl.trim(), "sponsors").catch(
      () => null,
    )
  }
  if (!safeImageUrl) {
    safeImageUrl = await cacheFavicon(websiteUrl).catch(() => null)
  }

  const settings = await getSettingsTyped()

  const start = parseISO(startDate)
  const end = parseISO(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 })
  }

  if (start > end) {
    return NextResponse.json(
      { error: "End date must be on or after start date" },
      { status: 400 }
    )
  }

  const today = format(new Date(), "yyyy-MM-dd")
  if (startDate < today) {
    return NextResponse.json(
      { error: "Start date cannot be in the past" },
      { status: 400 }
    )
  }

  const days = differenceInDays(end, start) + 1
  if (days > settings.sponsorMaxDays) {
    return NextResponse.json(
      { error: `Maximum ${settings.sponsorMaxDays} days per booking` },
      { status: 400 }
    )
  }

  const slot = await findAvailableSlot(
    startDate,
    endDate,
    settings.sponsorSlotCount
  )
  if (!slot) {
    return NextResponse.json(
      { error: "All slots are fully booked for these dates" },
      { status: 409 }
    )
  }

  const pricing = calculateSponsorPrice(days, {
    basePriceCents: settings.sponsorBasePriceCents,
    maxDiscount: settings.sponsorMaxDiscount,
    discountFullDays: settings.sponsorDiscountFullDays,
    maxDays: settings.sponsorMaxDays,
  })

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pricing.totalCents,
          product_data: {
            name: `Sponsor Slot — ${format(start, "MMM d")} to ${format(end, "MMM d, yyyy")} (${days} days)`,
            description: `${name}: ${tagline}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "sponsor",
      slot: String(slot),
      startDate,
      endDate,
      name,
      tagline,
      websiteUrl,
      imageUrl: safeImageUrl ?? "",
      userId: session.user.id,
    },
    customer_email: session.user.email,
    allow_promotion_codes: true,
    success_url: `${env.BETTER_AUTH_URL}/sponsor?success=true`,
    cancel_url: `${env.BETTER_AUTH_URL}/sponsor?canceled=true`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
