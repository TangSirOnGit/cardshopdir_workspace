import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Eye, Zap } from "lucide-react"
import { db } from "@/lib/db"
import { sponsors } from "@/lib/db/schema"
import { gte } from "drizzle-orm"
import { format } from "date-fns"
import { SponsorBooking } from "./sponsor-booking"
import { getSettingsTyped } from "@/lib/settings"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    title: `Sponsor ${settings.siteName} · Reach builders and early adopters`,
    description:
      "Put your product in front of thousands of builders, makers, and early adopters. Three sponsor slots visible across every page.",
    alternates: { canonical: "/sponsor" },
  }
}

const BENEFITS = [
  {
    icon: Eye,
    title: "Every page, every visit",
    text: "Your brand appears in the sidebar of the homepage and every product detail page.",
  },
  {
    icon: Zap,
    title: "Relevant audience",
    text: "Builders, indie hackers, and early adopters who actively try new tools.",
  },
]

export default async function SponsorPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string
    canceled?: string
    renew?: string
    name?: string
    tagline?: string
    url?: string
    image?: string
  }>
}) {
  const params = await searchParams
  const [settings, session] = await Promise.all([
    getSettingsTyped(),
    auth.api.getSession({ headers: await headers() }),
  ])

  const today = format(new Date(), "yyyy-MM-dd")

  const allSponsors = await db
    .select({
      slot: sponsors.slot,
      startsAt: sponsors.startsAt,
      endsAt: sponsors.endsAt,
    })
    .from(sponsors)
    .where(gte(sponsors.endsAt, today))

  const bookedRanges = allSponsors.map((s) => ({
    slot: s.slot,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-10 pt-2 sm:pt-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      {params.success && (
        <div
          role="status"
          className="rounded-xl bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-700 dark:text-emerald-400"
        >
          Payment received. Your sponsor slot will be active on the selected
          dates.
        </div>
      )}

      {params.canceled && (
        <div
          role="status"
          className="rounded-xl bg-muted/60 px-4 py-3 text-[13px] text-muted-foreground"
        >
          Payment canceled. You can try again below.
        </div>
      )}

      {/* Hero */}
      <header className="space-y-3">
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          Sponsor {settings.siteName}
        </h1>
      </header>

      {/* How it works */}
      <section className="space-y-4">
        <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          How it works
        </p>
        <div className="space-y-3 text-[14px]">
          <div className="flex gap-3">
            <span className="mt-px shrink-0 text-[13px] text-muted-foreground tabular-nums">
              1.
            </span>
            <p>
              Select your date range on the calendar. A slot is assigned
              automatically.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="mt-px shrink-0 text-[13px] text-muted-foreground tabular-nums">
              2.
            </span>
            <p>Fill in your brand details: name, tagline, link, and logo.</p>
          </div>
          <div className="flex gap-3">
            <span className="mt-px shrink-0 text-[13px] text-muted-foreground tabular-nums">
              3.
            </span>
            <p>
              Pay via Stripe. Your sponsor card goes live automatically on the
              selected dates.
            </p>
          </div>
        </div>
      </section>

      {/* Booking */}
      <section className="space-y-4">
        <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          Book a slot
        </p>
        {session?.user ? (
          <SponsorBooking
            bookedRanges={bookedRanges}
            sponsorSlotCount={settings.sponsorSlotCount}
            pricingConfig={{
              basePriceCents: settings.sponsorBasePriceCents,
              maxDiscount: settings.sponsorMaxDiscount,
              discountFullDays: settings.sponsorDiscountFullDays,
              maxDays: settings.sponsorMaxDays,
            }}
            prefill={params.renew ? {
              name: params.name ?? "",
              tagline: params.tagline ?? "",
              websiteUrl: params.url ?? "",
              imageUrl: params.image ?? "",
            } : undefined}
          />
        ) : (
          <div className="rounded-xl border border-border/50 bg-muted/40 px-4 py-6 text-center">
            <p className="text-[14px] text-muted-foreground">
              <Link href="/sign-in" className="font-medium text-foreground underline transition-opacity hover:opacity-60">
                Sign in
              </Link>{" "}
              to book a sponsor slot.
            </p>
          </div>
        )}
      </section>

      {/* Benefits */}
      <section className="space-y-4">
        <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          Why sponsor
        </p>
        <div className="space-y-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-3">
              <b.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[14px] font-medium">{b.title}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {b.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
