import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    title: `About · ${settings.siteName}`,
    description: `${settings.siteName} is a directory of trading card shops across the United States. Browse by state, city, and game.`,
    alternates: { canonical: "/about" },
  }
}

export default async function AboutPage() {
  const settings = await getSettingsTyped()
  const contactEmail =
    settings.contactEmail ||
    `contact@${new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").hostname}`

  const stats = await db
    .select({
      totalProducts: sql<number>`count(*)::int`,
      totalBatches: sql<number>`count(distinct ${products.batchId})::int`,
    })
    .from(products)
    .then((r) => r[0])

  return (
    <div className="mx-auto max-w-2xl space-y-10 pt-2 sm:pt-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <header className="space-y-3">
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          About {settings.siteName}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {settings.siteDescription}
        </p>
      </header>

      <div className="space-y-6 text-[14px] leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-medium text-foreground">What we do</h2>
          <p>
            Every week, we curate and publish a batch of the best new products,
            tools, and side projects. Makers submit their work, the community
            votes, and the top launches earn visibility and a permanent dofollow
            backlink.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">How it works</h2>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <strong>Submit</strong> your product for free or pick a paid tier
              for faster, guaranteed placement.
            </li>
            <li>
              <strong>Review</strong> &mdash; our team reviews every submission
              for quality before publishing.
            </li>
            <li>
              <strong>Launch</strong> &mdash; accepted products go live in the
              next weekly batch.
            </li>
            <li>
              <strong>Vote</strong> &mdash; the community votes for their
              favorites throughout the week.
            </li>
          </ul>
        </section>

        {stats && (stats.totalProducts > 0 || stats.totalBatches > 0) && (
          <section className="space-y-3">
            <h2 className="font-medium text-foreground">By the numbers</h2>
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg border border-border/50 bg-muted/40 px-4 py-3 text-center">
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {stats.totalProducts}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  products launched
                </p>
              </div>
              <div className="flex-1 rounded-lg border border-border/50 bg-muted/40 px-4 py-3 text-center">
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {stats.totalBatches}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  weekly batches
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">For makers</h2>
          <p>
            Whether you just shipped a weekend project or a funded product,
            {settings.siteName} gives you a stage in front of builders,
            early adopters, and curious minds.
          </p>
          <Link
            href="/submit"
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground transition-opacity hover:opacity-60"
          >
            Submit your product
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">For sponsors</h2>
          <p>
            Reach thousands of builders every week. Sponsor slots are visible on
            every page of the site.
          </p>
          <Link
            href="/sponsor"
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground transition-opacity hover:opacity-60"
          >
            Become a sponsor
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Contact</h2>
          <p>
            Questions, partnerships, or feedback? Reach us at{" "}
            <a href={`mailto:${contactEmail}`} className="underline">
              {contactEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
