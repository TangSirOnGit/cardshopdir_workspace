import { db } from "@/lib/db"
import { batches, products, votes } from "@/lib/db/schema"
import { eq, and, desc, gt, sql } from "drizzle-orm"
import { getISOWeek, getISOWeekYear } from "date-fns"
import { ProductGrid, type ProductItem } from "@/components/product-grid"
import { Countdown } from "@/components/countdown"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Layers, BookOpen, Megaphone } from "lucide-react"
import { SponsorSlots } from "@/components/sponsor-slot"
import { getSettingsTyped } from "@/lib/settings"

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
      {children}
    </p>
  )
}

function ResourceLink({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 text-[13px] transition-colors hover:bg-muted/70"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
      <span className="flex-1 text-muted-foreground group-hover:text-foreground">
        {children}
      </span>
    </Link>
  )
}

export default async function Home() {
  const now = new Date()
  const adjusted = new Date(now.getTime() - 6 * 60 * 60 * 1000)
  const currentWeek = getISOWeek(adjusted)
  const currentYear = getISOWeekYear(adjusted)

  const [batch, session, activeHighlights, settings] = await Promise.all([
    db.query.batches.findFirst({
      where: and(
        eq(batches.weekNumber, currentWeek),
        eq(batches.year, currentYear)
      ),
      orderBy: desc(batches.createdAt),
    }),
    auth.api.getSession({ headers: await headers() }),
    db.query.products.findMany({
      where: and(
        eq(products.tier, "highlight"),
        gt(products.highlightExpiresAt, now)
      ),
    }),
    getSettingsTyped(),
  ])

  // Fetch previous batch winners + global stats in parallel
  const [batchProducts, votedProductIds, prevBatchWinners, stats] =
    await Promise.all([
      batch
        ? db.query.products.findMany({
            where: eq(products.batchId, batch.id),
          })
        : [],
      session
        ? db
            .select({ productId: votes.productId })
            .from(votes)
            .where(eq(votes.userId, session.user.id))
            .then((rows) => rows.map((v) => v.productId))
        : ([] as number[]),
      // Previous batch top 3
      (async () => {
        const prevBatch = await db
          .select({ id: batches.id, weekNumber: batches.weekNumber })
          .from(batches)
          .where(
            sql`(${batches.year}, ${batches.weekNumber}) < (${currentYear}, ${currentWeek})`
          )
          .orderBy(desc(batches.year), desc(batches.weekNumber))
          .limit(1)
          .then((r) => r[0])

        if (!prevBatch) return []

        return db
          .select({
            name: products.name,
            slug: products.slug,
            tagline: products.tagline,
            logoUrl: products.logoUrl,
            thumbnailUrl: products.thumbnailUrl,
            voteCount: products.voteCount,
          })
          .from(products)
          .where(eq(products.batchId, prevBatch.id))
          .orderBy(desc(products.voteCount))
          .limit(3)
      })(),
      // Global stats
      db
        .select({
          totalProducts: sql<number>`count(*)::int`,
          totalBatches: sql<number>`count(distinct ${products.batchId})::int`,
        })
        .from(products)
        .then((r) => r[0]),
    ])

  const highlightIds = new Set(activeHighlights.map((h) => h.id))
  const nonHighlights = batchProducts.filter((p) => !highlightIds.has(p.id))

  const sorted = [...nonHighlights].sort((a, b) => {
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  const merged: (typeof activeHighlights)[number][] = []
  let hi = 0
  let oi = 0
  const total = activeHighlights.length + sorted.length
  for (let i = 0; i < total; i++) {
    if (i % 2 === 0 && hi < activeHighlights.length) {
      merged.push(activeHighlights[hi++])
    } else if (oi < sorted.length) {
      merged.push(sorted[oi++])
    } else if (hi < activeHighlights.length) {
      merged.push(activeHighlights[hi++])
    }
  }

  const items: ProductItem[] = merged.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    tagline: p.tagline,
    thumbnailUrl: p.thumbnailUrl,
    logoUrl: p.logoUrl ?? null,
    tier: p.tier,
    voteCount: p.voteCount,
    voted: votedProductIds.includes(p.id),
  }))

  return (
    <div className="space-y-8 pt-2 sm:pt-4">
      {/* ── Hero ─────────────────────────────────────── */}
      <header>
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          {settings.siteTagline.includes(",") ? (
            <>
              {settings.siteTagline.split(",")[0]},{" "}
              <span className="text-muted-foreground">
                {settings.siteTagline.split(",").slice(1).join(",")}
              </span>
            </>
          ) : (
            settings.siteTagline
          )}
        </h1>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
          {settings.siteDescription}
        </p>
      </header>

      {/* ── Two-column layout ────────────────────────── */}
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="font-medium tabular-nums">
                Week {currentWeek}, {currentYear}
              </span>
              <span className="text-border">&middot;</span>
              <span className="tabular-nums">
                {batchProducts.length} product
                {batchProducts.length !== 1 && "s"}
              </span>
            </div>
            <Countdown />
          </div>

          {items.length > 0 ? (
            <ProductGrid items={items} />
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm text-muted-foreground">
                No launches this week yet.
              </p>
              <Link
                href="/submit"
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-60"
              >
                Be the first
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* ── Last week's top launches ────────────────── */}
          {prevBatchWinners.length > 0 && (
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold">
                  Last week&rsquo;s top launches
                </h2>
                <Link
                  href="/batches"
                  className="group flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  All batches
                  <ArrowRight className="h-3 w-3 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </div>
              <div className="grid gap-x-6 sm:grid-cols-3">
                {prevBatchWinners.map((p, i) => (
                  <Link
                    key={p.slug}
                    href={`/p/${p.slug}`}
                    className="group flex items-start gap-3 border-t border-border/60 py-3.5 transition-colors sm:block"
                  >
                    {/* Thumbnail: small on mobile (left), full-width on sm:+ (below text) */}
                    {p.thumbnailUrl && (
                      <Image
                        src={p.thumbnailUrl}
                        alt={`${p.name} thumbnail`}
                        width={400}
                        height={225}
                        className="aspect-video w-24 shrink-0 rounded-md bg-muted object-cover ring-1 ring-border/40 transition-opacity group-hover:opacity-90 sm:order-2 sm:mt-3 sm:w-full sm:rounded-lg"
                      />
                    )}

                    <div className="min-w-0 flex-1 sm:order-1">
                      <p className="mb-1 text-[10px] font-medium tracking-widest text-muted-foreground/30 uppercase sm:mb-1.5">
                        #{i + 1}
                      </p>
                      <p className="truncate text-[14px] leading-tight font-semibold transition-colors group-hover:text-muted-foreground">
                        {p.name}
                      </p>
                      {p.tagline && (
                        <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground/60 sm:truncate">
                          {p.tagline}
                        </p>
                      )}
                      {p.voteCount > 0 && (
                        <p className="mt-1.5 text-[11px] text-muted-foreground/40 tabular-nums">
                          {p.voteCount} votes
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex shrink-0 flex-col space-y-5 lg:sticky lg:top-20 lg:w-64 lg:self-start">
          {/* Submit CTA */}
          <div className="space-y-2">
            <SidebarLabel>Get started</SidebarLabel>
            <div className="rounded-lg border border-border/50 bg-muted/40 px-3.5 py-3.5">
              <p className="text-[13px] font-semibold">Submit a product</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                Get featured in this week&rsquo;s batch.
              </p>
              <Link
                href="/submit"
                className="mt-3 inline-flex h-8 items-center justify-center rounded-lg bg-foreground px-3.5 text-[12px] font-medium text-background transition-opacity hover:opacity-85"
              >
                Submit
              </Link>
            </div>
          </div>

          {/* Stats */}
          {stats && (stats.totalProducts > 0 || stats.totalBatches > 0) && (
            <div className="space-y-2">
              <SidebarLabel>Stats</SidebarLabel>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 text-center">
                  <p className="text-lg leading-tight font-semibold tabular-nums">
                    {stats.totalProducts}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    products
                  </p>
                </div>
                <div className="flex-1 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 text-center">
                  <p className="text-lg leading-tight font-semibold tabular-nums">
                    {stats.totalBatches}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    batches
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sponsors */}
          <div className="space-y-2">
            <SidebarLabel>Sponsors</SidebarLabel>
            <SponsorSlots />
          </div>

          {/* Resources */}
          <div className="space-y-2">
            <SidebarLabel>Resources</SidebarLabel>
            <div className="space-y-1.5">
              <ResourceLink href="/batches" icon={Layers}>
                Past batches
              </ResourceLink>
              <ResourceLink href="/blog" icon={BookOpen}>
                Blog
              </ResourceLink>
              <ResourceLink href="/sponsor" icon={Megaphone}>
                Become a sponsor
              </ResourceLink>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
