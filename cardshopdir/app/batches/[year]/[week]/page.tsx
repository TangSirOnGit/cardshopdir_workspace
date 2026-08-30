import { db } from "@/lib/db"
import { batches, products, votes } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { setISOWeek, setISOWeekYear, startOfISOWeek } from "date-fns"
import { notFound } from "next/navigation"
import { ProductGrid } from "@/components/product-grid"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import { getSetting } from "@/lib/settings"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

interface Props {
  params: Promise<{ year: string; week: string }>
}

export async function generateStaticParams() {
  const allBatches = await db.query.batches.findMany({
    columns: { year: true, weekNumber: true },
  })
  return allBatches.map((b) => ({
    year: String(b.year),
    week: String(b.weekNumber),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, week } = await params
  const siteName = await getSetting("site_name")
  return {
    title: `Week ${week}, ${year} · Product launches on ${siteName}`,
    description: `Discover the products launched in week ${week} of ${year}. A curated batch of the best new tools, handpicked by ${siteName}.`,
    alternates: { canonical: `/batches/${year}/${week}` },
  }
}

export default async function BatchWeekPage({ params }: Props) {
  const { year, week } = await params
  const yearNum = parseInt(year)
  const weekNum = parseInt(week)

  const [batch, session] = await Promise.all([
    db.query.batches.findFirst({
      where: and(eq(batches.year, yearNum), eq(batches.weekNumber, weekNum)),
    }),
    auth.api.getSession({ headers: await headers() }),
  ])

  if (!batch) notFound()

  const [items, votedProductIds] = await Promise.all([
    db.query.products.findMany({
      where: eq(products.batchId, batch.id),
      orderBy: asc(products.position),
    }),
    session
      ? db
          .select({ productId: votes.productId })
          .from(votes)
          .where(eq(votes.userId, session.user.id))
          .then((rows) => rows.map((v) => v.productId))
      : ([] as number[]),
  ])

  const launchDate = startOfISOWeek(
    setISOWeek(setISOWeekYear(new Date(), yearNum), weekNum),
  )

  return (
    <div className="space-y-6 pt-2 sm:pt-4">
      <div>
        <Link
          href="/batches"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All batches
        </Link>
        <div className="mt-3 flex items-baseline gap-3">
          <h1 className="font-serif text-2xl tracking-tight">
            Week {weekNum}, {yearNum}
          </h1>
          <span className="text-[13px] text-muted-foreground">
            {new Intl.DateTimeFormat("en", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(launchDate)}
          </span>
          <span className="text-[13px] text-muted-foreground">
            · {items.length} product{items.length !== 1 && "s"}
          </span>
        </div>
      </div>

      <ProductGrid
        items={items.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          tagline: product.tagline,
          thumbnailUrl: product.thumbnailUrl,
          logoUrl: product.logoUrl ?? null,
          tier: product.tier,
          voteCount: product.voteCount,
          voted: votedProductIds.includes(product.id),
        }))}
      />
    </div>
  )
}
