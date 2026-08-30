import { db } from "@/lib/db"
import { products, batches, submissions } from "@/lib/db/schema"
import { eq, desc, and, isNull } from "drizzle-orm"
import { getISOWeek, getISOWeekYear } from "date-fns"
import { ContentHub } from "./content-hub"
import { SITE_URL } from "@/config"
import { getSetting } from "@/lib/settings"

export const metadata = { title: "Content - Admin" }

async function getCurrentBatchProducts() {
  const now = new Date()
  const week = getISOWeek(now)
  const year = getISOWeekYear(now)

  return db
    .select({
      name: products.name,
      slug: products.slug,
      tagline: products.tagline,
      tier: products.tier,
      websiteUrl: products.websiteUrl,
      thumbnailUrl: products.thumbnailUrl,
      voteCount: products.voteCount,
    })
    .from(products)
    .innerJoin(batches, eq(products.batchId, batches.id))
    .where(and(eq(batches.weekNumber, week), eq(batches.year, year)))
    .orderBy(desc(products.voteCount))
}

async function getLastBatchData() {
  const lastBatch = await db
    .select({
      id: batches.id,
      weekNumber: batches.weekNumber,
      year: batches.year,
    })
    .from(batches)
    .orderBy(desc(batches.year), desc(batches.weekNumber))
    .limit(1)
    .then((rows) => rows[0])

  if (!lastBatch) return { products: [], week: 0, year: 0 }

  const items = await db
    .select({
      name: products.name,
      slug: products.slug,
      tagline: products.tagline,
      tier: products.tier,
      websiteUrl: products.websiteUrl,
      thumbnailUrl: products.thumbnailUrl,
      voteCount: products.voteCount,
    })
    .from(products)
    .where(eq(products.batchId, lastBatch.id))
    .orderBy(desc(products.voteCount))

  return { products: items, week: lastBatch.weekNumber, year: lastBatch.year }
}

async function getUpcomingProducts() {
  return db
    .select({
      name: submissions.name,
      tagline: submissions.tagline,
      tier: submissions.tier,
    })
    .from(submissions)
    .where(
      and(eq(submissions.status, "accepted"), isNull(submissions.publishedAt)),
    )
    .orderBy(submissions.scheduledWeek)
}

export default async function ContentPage() {
  const [currentProducts, lastBatch, upcoming, siteName] = await Promise.all([
    getCurrentBatchProducts(),
    getLastBatchData(),
    getUpcomingProducts(),
    getSetting("site_name"),
  ])

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Content</h1>
      <ContentHub
        currentProducts={currentProducts}
        lastBatchProducts={lastBatch.products}
        lastBatchWeek={lastBatch.week}
        upcomingProducts={upcoming}
        siteUrl={SITE_URL}
        siteName={siteName}
      />
    </div>
  )
}
