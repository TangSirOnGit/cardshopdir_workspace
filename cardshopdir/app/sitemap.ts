import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { batches } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { SITE_URL } from "@/config"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL

  const allProducts = await db.query.products.findMany({
    columns: { slug: true, createdAt: true },
  })

  const allBatches = await db.query.batches.findMany({
    columns: { year: true, weekNumber: true, createdAt: true },
    orderBy: [desc(batches.year), desc(batches.weekNumber)],
  })

  const allPosts = await db.query.posts?.findMany({
    columns: { slug: true, updatedAt: true, publishedAt: true },
    where: (posts, { eq }) => eq(posts.status, "published"),
  }) ?? []

  const now = new Date()

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/batches`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/submit`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/sponsor`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/newsletter`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...allBatches.map((b) => ({
      url: `${baseUrl}/batches/${b.year}/${b.weekNumber}`,
      lastModified: b.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...allProducts.map((p) => ({
      url: `${baseUrl}/p/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...allPosts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt ?? p.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
