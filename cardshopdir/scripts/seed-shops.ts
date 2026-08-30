/**
 * Import shops from data/shops_final.jsonl into the database.
 *
 * Reads the cleaned + enriched JSONL file, inserts:
 *   - shops table (7,722 records)
 *   - shop_games table (many-to-many with games)
 *   - shop_hours table (opening hours)
 *
 * Usage: bun run scripts/seed-shops.ts
 *
 * Options:
 *   --dry-run   Parse and validate without inserting
 *   --limit N   Only import first N records (for testing)
 */
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { db } from "@/lib/db"
import { shops, shopGames, shopHours, games } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sql } from "drizzle-orm"

// ── Types matching our JSONL ─────────────────────────────────────
interface ShopRecord {
  name: string
  city: string | null
  state: string | null
  country: string
  description: string
  meta_description: string | null
  email: string | null
  games: string[]
  hours: { days: string[]; opens: string; closes: string }[]
  image: string
  image_source: string
  latitude: number | null
  longitude: number | null
  meta_description_field?: string
  missing_city: boolean
  missing_latlng: boolean
  missing_state: boolean
  name_field?: string
  postal_code: string | null
  rating_value: string | null
  review_count: string | null
  shop_type: string
  source_url: string
  street: string
  telephone: string | null
  website: string
  description_source?: string
  games_source?: string
}

// ── Helpers ──────────────────────────────────────────────────────

function getSlug(sourceUrl: string): string {
  const parts = sourceUrl.split("/shop/")
  return parts.length > 1 ? parts[parts.length - 1] : ""
}

function shouldIndexShop(r: ShopRecord): boolean {
  const rc = parseInt(r.review_count || "0", 10)
  const hasHours = r.hours && r.hours.length > 0
  const hasGames = r.games && r.games.length > 0
  const notTemplated = !(
    r.description && r.description.includes(" - Trading card game shop in ")
  )
  return rc > 10 && hasHours && hasGames && notTemplated
}

const SHOP_TYPE_MAP: Record<string, typeof shops.$inferInsert.shopType> = {
  tcg_specialty: "tcg_specialty",
  comic_shop: "comic_shop",
  game_store: "game_store",
  sports_cards: "sports_cards",
  hobby_store: "hobby_store",
  toy_store: "toy_store",
  collectibles: "collectibles",
  general_retail: "general_retail",
  other: "other",
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const limitArg = args.find((a) => a.startsWith("--limit"))
  const limit = limitArg
    ? parseInt(limitArg.split("=")[1] || args[args.indexOf(limitArg) + 1], 10)
    : 0

  // Load JSONL
  const jsonlPath = join(process.cwd(), "..", "data", "shops_final.jsonl")
  console.log(`Reading: ${jsonlPath}`)

  const content = await readFile(jsonlPath, "utf-8")
  const lines = content.trim().split("\n")
  const records: ShopRecord[] = lines.map((l) => JSON.parse(l))

  console.log(`Loaded ${records.length} records`)
  if (limit > 0) {
    console.log(`Limiting to first ${limit} records`)
  }

  const toImport = limit > 0 ? records.slice(0, limit) : records

  if (dryRun) {
    console.log("\n=== DRY RUN ===")
    let valid = 0
    let noCity = 0
    let noState = 0
    let noLat = 0
    let hasGames = 0
    let hasHours = 0
    let hasImage = 0
    let shouldIndex = 0

    for (const r of toImport) {
      if (r.city) valid++
      else noCity++
      if (!r.state) noState++
      if (!r.latitude) noLat++
      if (r.games?.length) hasGames++
      if (r.hours?.length) hasHours++
      if (r.image) hasImage++
      if (shouldIndexShop(r)) shouldIndex++
    }

    console.log(`  Valid (has city):     ${valid}`)
    console.log(`  Missing city:         ${noCity}`)
    console.log(`  Missing state:        ${noState}`)
    console.log(`  Missing lat/lng:      ${noLat}`)
    console.log(`  Has games:            ${hasGames}`)
    console.log(`  Has hours:            ${hasHours}`)
    console.log(`  Has image:            ${hasImage}`)
    console.log(`  Should index:         ${shouldIndex}`)
    console.log(`  Total:                ${toImport.length}`)
    process.exit(0)
  }

  // Build game slug → id map
  const allGames = await db.select().from(games)
  const gameMap = new Map<string, number>()
  for (const g of allGames) {
    gameMap.set(g.slug, g.id)
  }
  console.log(`Loaded ${gameMap.size} games from database`)

  // Check if shops already exist
  const existingCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(shops)
  if (existingCount[0].count > 0) {
    console.log(
      `⚠️  Database already has ${existingCount[0].count} shops. Truncating...`
    )
    await db.execute(
      sql`TRUNCATE shop_games, shop_hours, shop_reviews, shop_claims, shops CASCADE`
    )
  }

  // Import in batches
  const BATCH_SIZE = 100
  let imported = 0
  let gamesLinked = 0
  let hoursInserted = 0
  let errors = 0

  for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
    const batch = toImport.slice(i, i + BATCH_SIZE)
    const batchShops: (typeof shops.$inferInsert)[] = []

    for (const r of batch) {
      const slug = getSlug(r.source_url)
      if (!slug) {
        errors++
        continue
      }

      batchShops.push({
        slug,
        name: r.name,
        description: r.description || null,
        metaDescription: r.meta_description || null,
        descriptionSource: (r.description_source as string) || "original",
        street: r.street || null,
        city: r.city || null,
        state: r.state || null,
        postalCode: r.postal_code || null,
        country: r.country || "United States",
        latitude: r.latitude?.toString() || null,
        longitude: r.longitude?.toString() || null,
        telephone: r.telephone || null,
        email: r.email || null,
        website: r.website || null,
        imageUrl: r.image || null,
        imageSource: (r.image_source as string) || "none",
        ratingValue: r.rating_value || null,
        reviewCount: r.review_count ? parseInt(r.review_count, 10) : 0,
        shopType: SHOP_TYPE_MAP[r.shop_type] || "other",
        shouldIndex: shouldIndexShop(r),
        sourceUrl: r.source_url,
      })
    }

    // Insert shops batch
    if (batchShops.length === 0) {
      console.log(`  [${imported}/${toImport.length}] skipped empty batch`)
      continue
    }
    const inserted = await db
      .insert(shops)
      .values(batchShops)
      .returning({ id: shops.id, slug: shops.slug })

    // Build slug → id map for this batch
    const shopIdMap = new Map<string, number>()
    for (const s of inserted) {
      shopIdMap.set(s.slug, s.id)
    }

    // Insert shop_games and shop_hours for this batch
    const batchShopGames: (typeof shopGames.$inferInsert)[] = []
    const batchShopHours: (typeof shopHours.$inferInsert)[] = []

    for (const r of batch) {
      const slug = getSlug(r.source_url)
      const shopId = shopIdMap.get(slug)
      if (!shopId) continue

      // Games
      for (const gameSlug of r.games || []) {
        const gameId = gameMap.get(gameSlug)
        if (gameId) {
          batchShopGames.push({
            shopId,
            gameId,
            gameSource: (r.games_source as string) || "original",
          })
        }
      }

      // Hours
      for (let h = 0; h < (r.hours || []).length; h++) {
        const hour = r.hours[h]
        batchShopHours.push({
          shopId,
          days: hour.days,
          opens: hour.opens || null,
          closes: hour.closes || null,
          sortOrder: h,
        })
      }
    }

    if (batchShopGames.length > 0) {
      await db.insert(shopGames).values(batchShopGames).onConflictDoNothing()
      gamesLinked += batchShopGames.length
    }

    if (batchShopHours.length > 0) {
      await db.insert(shopHours).values(batchShopHours)
      hoursInserted += batchShopHours.length
    }

    imported += batch.length
    if (imported % 500 === 0 || imported === toImport.length) {
      console.log(
        `  [${imported}/${toImport.length}] shops imported, ${gamesLinked} games linked, ${hoursInserted} hours inserted`
      )
    }
  }

  // Final stats
  console.log(`\n=== Import Complete ===`)
  console.log(`  Shops imported:    ${imported}`)
  console.log(`  Games linked:      ${gamesLinked}`)
  console.log(`  Hours inserted:    ${hoursInserted}`)
  console.log(`  Errors:            ${errors}`)

  // Verify
  const finalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(shops)
  const indexedCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(shops)
    .where(eq(shops.shouldIndex, true))
  console.log(`\n  Database shops:    ${finalCount[0].count}`)
  console.log(`  Should index:      ${indexedCount[0].count}`)

  process.exit(0)
}

main().catch((err) => {
  console.error("Failed to import shops:", err)
  process.exit(1)
})
