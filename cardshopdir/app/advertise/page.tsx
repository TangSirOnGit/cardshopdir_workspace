import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Check, Mail } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"

const PLANS = [
  { id: "7d", name: "Starter", days: 7, price: 29 },
  { id: "30d", name: "Standard", days: 30, price: 79, popular: true },
  { id: "90d", name: "Season", days: 90, price: 199 },
] as const

const PERKS = [
  "Pinned above regular listings on state, city and game pages",
  "\u201CFeatured\u201D badge on your shop card",
  "Featured placement on the homepage",
]

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    title: `Advertise & Feature Your Shop · ${settings.siteName}`,
    description: `Get your card shop featured on ${settings.siteName}. Top placement on state and city pages, a Featured badge, and homepage exposure.`,
    alternates: { canonical: "/advertise" },
  }
}

export default async function AdvertisePage() {
  const settings = await getSettingsTyped()
  const contactEmail =
    settings.contactEmail ||
    `contact@${new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").hostname}`

  const ctaFor = (plan: (typeof PLANS)[number]) => {
    const link = process.env[`ADVERTISE_PAYMENT_LINK_${plan.id.toUpperCase()}`]
    if (link) return { href: link, label: "Buy now", external: true }
    const subject = encodeURIComponent(
      `Feature my shop: ${plan.name} (${plan.days} days)`
    )
    const body = encodeURIComponent(
      "Shop name and page URL:\nPreferred start date:\n"
    )
    return {
      href: `mailto:${contactEmail}?subject=${subject}&body=${body}`,
      label: "Request this plan",
      external: false,
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 pt-2 sm:pt-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <header className="space-y-3">
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          Feature your card shop
        </h1>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          Reach collectors searching for local card shops in your area. Featured
          shops are shown first on state and city pages and highlighted across{" "}
          {settings.siteName}.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const cta = ctaFor(plan)
          const popular = "popular" in plan && plan.popular
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-lg border bg-muted/40 p-5 ${
                popular ? "border-primary" : "border-border/50"
              }`}
            >
              <p className="label-mono text-primary">
                {popular ? "Most popular" : plan.name}
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight">
                ${plan.price}
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {plan.days} days &middot; ${(plan.price / plan.days).toFixed(2)}
                /day
              </p>
              <a
                href={cta.href}
                {...(cta.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-80"
              >
                {cta.label}
              </a>
            </div>
          )
        })}
      </section>

      <div className="space-y-6 text-[14px] leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="font-medium text-foreground">What you get</h2>
          <ul className="space-y-2">
            {PERKS.map((perk) => (
              <li key={perk} className="flex gap-2">
                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                {perk}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">How it works</h2>
          <ol className="list-inside list-decimal space-y-1 pl-1">
            <li>Pick a plan and complete payment (or request it by email).</li>
            <li>
              Send us your shop page URL and preferred start date if you
              haven&rsquo;t already.
            </li>
            <li>
              We activate your listing, usually within 1 business day, and
              confirm by email.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-foreground">Questions?</h2>
          <p>
            Need a custom package, multiple locations, or a different date
            range? Email us.
          </p>
          <a
            href={`mailto:${contactEmail}?subject=${encodeURIComponent("Advertising enquiry")}`}
            className="inline-flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/40 px-4 py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-muted/70"
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            {contactEmail}
          </a>
        </section>
      </div>
    </div>
  )
}
