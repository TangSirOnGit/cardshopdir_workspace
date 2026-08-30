import { db } from "@/lib/db"
import { products, batches } from "@/lib/db/schema"
import { desc, asc, count, ilike, eq, or, sql } from "drizzle-orm"
import { productsParamsCache } from "./search-params"
import { ProductList } from "./product-list"
import type { SearchParams } from "nuqs/server"
import { getSettingNumber } from "@/lib/settings"

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const PER_PAGE = await getSettingNumber("admin_products_per_page")
  const { page, q, tier, sort } = await productsParamsCache.parse(searchParams)

  const conditions = []
  if (q) {
    conditions.push(
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.slug, `%${q}%`),
        ilike(products.tagline, `%${q}%`),
      ),
    )
  }
  if (tier) {
    conditions.push(eq(products.tier, tier as "free" | "boost" | "highlight"))
  }

  const where =
    conditions.length === 2
      ? sql`${conditions[0]} AND ${conditions[1]}`
      : conditions[0]

  const orderBy =
    sort === "oldest"
      ? asc(products.createdAt)
      : sort === "votes"
        ? desc(products.voteCount)
        : sort === "name"
          ? asc(products.name)
          : desc(products.createdAt)

  const [totalResult] = await db
    .select({ count: count() })
    .from(products)
    .where(where)
  const total = totalResult.count
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(page, totalPages)

  const items = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      tagline: products.tagline,
      thumbnailUrl: products.thumbnailUrl,
      websiteUrl: products.websiteUrl,
      tier: products.tier,
      voteCount: products.voteCount,
      dofollow: products.dofollow,
      position: products.position,
      batchId: products.batchId,
      createdAt: products.createdAt,
      batchWeek: batches.weekNumber,
      batchYear: batches.year,
    })
    .from(products)
    .leftJoin(batches, eq(products.batchId, batches.id))
    .where(where)
    .orderBy(orderBy)
    .limit(PER_PAGE)
    .offset((safePage - 1) * PER_PAGE)

  return (
    <ProductList
      products={items}
      total={total}
      page={safePage}
      totalPages={totalPages}
    />
  )
}
