import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, Minus, Megaphone } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    title: `Pricing · ${settings.siteName}`,
    description: `Submit your product for free or choose a paid tier for guaranteed placement. Sponsor ${settings.siteName} to reach builders every week.`,
    alternates: { canonical: "/pricing" },
  }
}

export default async function PricingPage() {
  const settings = await getSettingsTyped()

  const boostPrice = (settings.boostPriceCents / 100).toFixed(0)
  const highlightPrice = (settings.highlightPriceCents / 100).toFixed(0)
  const sponsorDailyCents = settings.sponsorBasePriceCents
  const sponsorWeeklyPrice = Math.round((sponsorDailyCents * 7) / 100)
  const sponsorMonthlyDiscounted = Math.round(
    (sponsorDailyCents * 30 * (1 - settings.sponsorMaxDiscount)) / 100,
  )
  const sponsorMaxDiscount = Math.round(settings.sponsorMaxDiscount * 100)
  const sponsorSlotCount = settings.sponsorSlotCount

  const tiers = [
    {
      name: "Free",
      price: "$0",
      description: "Get listed in the next available batch.",
      features: [
        { text: "Listed in a weekly batch", included: true },
        { text: "Dofollow backlink if top 3 by votes", included: true },
        { text: "Newsletter mention if top 3 by votes", included: true },
        { text: "Pinned on homepage", included: false },
        { text: "Instant publishing", included: false },
      ],
      cta: "Submit for free",
      href: "/submit?tier=free",
      highlighted: false,
    },
    {
      name: "Boost",
      price: `$${boostPrice}`,
      description: "Guaranteed in the next batch.",
      features: [
        { text: "Guaranteed placement in next batch", included: true },
        { text: "Permanent dofollow backlink", included: true },
        { text: "Guaranteed newsletter mention", included: true },
        { text: "Skip moderation queue", included: true },
        { text: "Pinned on homepage", included: false },
      ],
      cta: "Submit with Boost",
      href: "/submit?tier=boost",
      highlighted: false,
    },
    {
      name: "Highlight",
      price: `$${highlightPrice}`,
      description: "Published instantly, featured for 7 days.",
      features: [
        { text: "Published instantly", included: true },
        { text: "Pinned on homepage for 7 days", included: true },
        { text: "Permanent dofollow backlink", included: true },
        { text: "Guaranteed newsletter mention", included: true },
        { text: "Skip moderation queue", included: true },
      ],
      cta: "Submit with Highlight",
      href: "/submit?tier=highlight",
      highlighted: true,
    },
  ]

  return (
    <div className="space-y-14 pt-2 sm:pt-4">
      {/* Header */}
      <header className="mx-auto max-w-xl text-center">
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          Submit your product for free or pick a paid tier for faster,
          guaranteed placement and a permanent dofollow backlink.
        </p>
      </header>

      {/* Tiers */}
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "relative flex flex-col rounded-xl border p-5 transition-colors",
              tier.highlighted
                ? "border-foreground bg-muted/30"
                : "border-border/60 bg-background hover:border-border"
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase">
                  {tier.name}
                </p>
                {tier.highlighted && (
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
                    Recommended
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-baseline gap-1.5 leading-none">
                <span className="text-3xl font-semibold tracking-tight">
                  {tier.price}
                </span>
                {tier.price !== "$0" && (
                  <span className="text-[13px] font-normal text-muted-foreground">
                    one-time
                  </span>
                )}
              </div>

              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {tier.description}
              </p>
            </div>

            <div className="my-5 h-px bg-border/60" />

            <ul className="flex-1 space-y-2">
              {tier.features.map((f) => (
                <li
                  key={f.text}
                  className="flex items-start gap-2 text-[13px] leading-snug"
                >
                  {f.included ? (
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <Minus className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/30" />
                  )}
                  <span
                    className={cn(
                      f.included
                        ? "text-foreground"
                        : "text-muted-foreground/40 line-through"
                    )}
                  >
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={tier.href}
              className={cn(
                "group mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-opacity hover:opacity-80",
                tier.highlighted
                  ? "bg-foreground text-background"
                  : "border border-border text-foreground hover:bg-muted"
              )}
            >
              {tier.cta}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        ))}
      </div>

      {/* Sponsor section */}
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/20 p-6 sm:p-8">
          <div className="absolute -top-8 -right-8 size-36 rounded-full bg-foreground/3 blur-2xl" />

          <div className="relative space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 backdrop-blur">
                <Megaphone className="size-3 text-foreground/70" />
                <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase">
                  Sponsorship
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Only {sponsorSlotCount} slot{sponsorSlotCount > 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2.5">
              <h3 className="max-w-xl font-serif text-[22px] leading-[1.15] tracking-tight sm:text-[28px]">
                Own the sidebar.
                <span className="block text-muted-foreground">
                  Seen on every page, every visit.
                </span>
              </h3>
              <p className="max-w-xl text-[14px] leading-relaxed text-muted-foreground">
                Not a banner. Not a popup. A clean slot right next to the
                launches readers came here for — the spot they actually look
                at.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
                  1 week
                </p>
                <p className="mt-1 font-serif text-[20px] font-semibold tracking-tight">
                  ${sponsorWeeklyPrice}
                </p>
                <p className="text-[11px] text-muted-foreground">Try it</p>
              </div>
              <div className="relative rounded-xl border border-foreground/80 bg-background p-3">
                <span className="absolute -top-2 right-2 rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-background uppercase">
                  Best value
                </span>
                <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
                  1 month
                </p>
                <p className="mt-1 font-serif text-[20px] font-semibold tracking-tight">
                  ${sponsorMonthlyDiscounted}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-500">
                  Save {sponsorMaxDiscount}%
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
                  Any duration
                </p>
                <p className="mt-1 font-serif text-[20px] font-semibold tracking-tight">
                  Flexible
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Pick your own dates
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12.5px] text-muted-foreground">
                Self-serve · live in under a minute · cancel anytime
              </p>
              <Link
                href="/sponsor"
                className="group inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
              >
                Become a sponsor
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ teaser */}
      <div className="mx-auto max-w-xl text-center">
        <p className="text-[13px] text-muted-foreground">
          Have questions?{" "}
          <Link
            href="/faq"
            className="font-medium text-foreground underline transition-opacity hover:opacity-60"
          >
            Check our FAQ
          </Link>{" "}
          or{" "}
          <Link
            href="/contact"
            className="font-medium text-foreground underline transition-opacity hover:opacity-60"
          >
            get in touch
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
