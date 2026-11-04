/**
 * Regenerate shops.meta_description from structured data (name, type, city,
 * state, games, rating) so SERP snippets stay consistent and mention reviews.
 *
 * Most rows currently hold scraped text (owner addresses, review excerpts),
 * which overrides the page-level template. Hand-written descriptions from
 * update-seo-first-batch.ts / update-shop-meta-descriptions.ts are skipped.
 *
 * Usage:
 *   bun run scripts/regenerate-shop-meta-descriptions.ts          # dry-run
 *   bun run scripts/regenerate-shop-meta-descriptions.ts --apply  # write
 */
/// <reference types="node" />
import { readFileSync } from "node:fs"
import { db } from "../lib/db"
import { shops, shopGames, games } from "../lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { shopSeoDescription } from "../lib/seo"
import { shopTypeLabel } from "../lib/shop-types"
import { stateName } from "../lib/directory"

const apply = process.argv.includes("--apply")

const curated = new Set<string>()
for (const f of ["update-seo-first-batch.ts", "update-shop-meta-descriptions.ts"]) {
  const src = readFileSync(new URL(`./${f}`, import.meta.url), "utf8")
  for (const m of src.matchAll(/slug:\s*"([^"]+)"/g)) curated.add(m[1])
}

const rows = await db
  .select({
    id: shops.id,
    slug: shops.slug,
    name: shops.name,
    shopType: shops.shopType,
    city: shops.city,
    state: shops.state,
    ratingValue: shops.ratingValue,
    reviewCount: shops.reviewCount,
    metaDescription: shops.metaDescription,
    games: sql<string[]>`coalesce(array_agg(${games.displayName} order by ${games.sortOrder}) filter (where ${games.id} is not null), '{}')`,
  })
  .from(shops)
  .leftJoin(shopGames, eq(shopGames.shopId, shops.id))
  .leftJoin(games, eq(games.id, shopGames.gameId))
  .groupBy(shops.id)

let changed = 0
let skipped = 0
const samples: string[] = []

for (const r of rows) {
  if (curated.has(r.slug)) {
    skipped++
    continue
  }
  const next = shopSeoDescription({
    name: r.name,
    typeLabel: shopTypeLabel(r.shopType),
    city: r.city,
    stateFull: r.state ? stateName(r.state) : null,
    ratingValue: r.ratingValue,
    reviewCount: r.reviewCount,
    games: r.games,
    hours: [],
  })
  if (next === r.metaDescription) continue
  changed++
  if (samples.length < 10) samples.push(`${r.slug}\n  old: ${r.metaDescription?.replace(/\s+/g, " ").slice(0, 120)}\n  new: ${next}`)
  if (apply) await db.update(shops).set({ metaDescription: next }).where(eq(shops.id, r.id))
}

console.log(samples.join("\n"))
console.log(`${apply ? "Applied" : "Dry run"}: ${changed} changed, ${skipped} curated skipped, ${rows.length} total.`)
process.exit(0)
