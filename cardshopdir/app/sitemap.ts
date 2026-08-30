import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { shops, games } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.BETTER_AUTH_URL || "https://cardshopdir.com"
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/directory/games`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ]

  // State directory pages
  const states = await db
    .select({ state: shops.state })
    .from(shops)
    .where(sql`${shops.state} is not null and ${shops.state} != ''`)
    .groupBy(shops.state)

  const statePages: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${baseUrl}/directory/${s.state!.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  // Game pages
  const allGames = await db.select().from(games)
  const gamePages: MetadataRoute.Sitemap = allGames.map((g) => ({
    url: `${baseUrl}/directory/games/${g.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  // City directory pages (state/city)
  const cities = await db
    .select({ state: shops.state, city: shops.city })
    .from(shops)
    .where(
      sql`${shops.state} is not null and ${shops.state} != '' and ${shops.city} is not null and ${shops.city} != ''`
    )
    .groupBy(shops.state, shops.city)

  const cityPages: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${baseUrl}/directory/${c.state!.toLowerCase()}/${c.city!.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  // Individual shop pages (only indexed shops)
  const indexedShops = await db
    .select({ slug: shops.slug, updatedAt: shops.updatedAt })
    .from(shops)
    .where(eq(shops.shouldIndex, true))

  const shopPages: MetadataRoute.Sitemap = indexedShops.map((s) => ({
    url: `${baseUrl}/shop/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }))

  return [
    ...staticPages,
    ...statePages,
    ...gamePages,
    ...cityPages,
    ...shopPages,
  ]
}
